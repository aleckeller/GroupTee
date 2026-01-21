import datetime
import os
import re
import time

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration from environment
GOLF_CLUB_USERNAME = os.environ.get("GOLF_CLUB_USERNAME")
GOLF_CLUB_PASSWORD = os.environ.get("GOLF_CLUB_PASSWORD")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
CLUB_ID = os.environ.get("CLUB_ID")

# Chrome paths with fallbacks
GOOGLE_CHROME_BIN = os.environ.get("GOOGLE_CHROME_BIN", "/usr/bin/google-chrome")
CHROMEDRIVER_PATH = os.environ.get("CHROMEDRIVER_PATH", "/usr/local/bin/chromedriver")


def create_driver():
    """Create and configure Chrome WebDriver."""
    chrome_options = webdriver.ChromeOptions()
    if os.path.exists(GOOGLE_CHROME_BIN):
        chrome_options.binary_location = GOOGLE_CHROME_BIN
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(executable_path=CHROMEDRIVER_PATH, options=chrome_options)
    driver.implicitly_wait(10)
    return driver


def normalize_name(name: str) -> str:
    """Normalize a name for matching (lowercase, trim, collapse whitespace)."""
    if not name:
        return ""
    return re.sub(r"\s+", " ", name.lower().strip())


def parse_time(time_str: str) -> str:
    """Convert '7:30 am' format to '07:30:00' PostgreSQL time format."""
    match = re.match(r"(\d{1,2}):(\d{2})\s*(am|pm)", time_str.lower())
    if not match:
        return "00:00:00"

    hours = int(match.group(1))
    minutes = match.group(2)
    period = match.group(3)

    if period == "pm" and hours != 12:
        hours += 12
    elif period == "am" and hours == 12:
        hours = 0

    return f"{hours:02d}:{minutes}:00"


def extract_tee_times(html: str) -> list[dict]:
    """Extract tee times and golfer names from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    tee_sheet = []
    table = soup.find("table", class_="table table-bordered header")
    if table:
        for row in table.find("tbody").find_all("tr"):
            cells = row.find_all("td")
            if not cells:
                continue
            tee_time = cells[0].get_text(strip=True)
            golfers = [cell.get_text(strip=True) for cell in cells[1:]]
            tee_sheet.append({"tee_time": tee_time, "golfers": golfers})
    return tee_sheet


def select_upcoming_day(driver, wait, day_of_week: int) -> str:
    """
    Select the upcoming date for the given day_of_week (Monday=0, Sunday=6).
    Returns the date string in YYYY-MM-DD format.
    """
    today = datetime.date.today()
    days_ahead = day_of_week - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    next_day = today + datetime.timedelta(days=days_ahead)
    target_day = next_day.day

    wait.until(
        expected_conditions.presence_of_element_located(
            (By.CSS_SELECTOR, "input[aria-describedby]")
        )
    )
    calendar_input = driver.find_element(
        By.CSS_SELECTOR, 'input[aria-describedby="dateInput"]'
    )
    calendar_input.click()

    wait.until(
        expected_conditions.presence_of_element_located(
            (By.CLASS_NAME, "ui-datepicker-calendar")
        )
    )
    calendar = driver.find_element(By.CLASS_NAME, "ui-datepicker-calendar")
    date_links = calendar.find_elements(By.TAG_NAME, "a")

    for link in date_links:
        date_text = link.get_attribute("textContent").strip()
        if date_text == str(target_day):
            driver.execute_script("arguments[0].click();", link)
            return next_day.isoformat()

    raise Exception(f"Upcoming day {day_of_week} not found in calendar.")


def go_to_teesheet_1757(driver, wait):
    """Navigate to the tee sheet page for 1757 Golf Club."""
    webpage = "https://www.1757golfclub.com/member-home"
    driver.get(webpage)

    # Wait for the login form to load
    wait.until(
        expected_conditions.presence_of_element_located((By.ID, "login_username_main"))
    )
    wait.until(
        expected_conditions.presence_of_element_located((By.ID, "login_password_main"))
    )

    # Enter credentials
    driver.find_element(By.ID, "login_username_main").send_keys(GOLF_CLUB_USERNAME)
    driver.find_element(By.ID, "login_password_main").send_keys(GOLF_CLUB_PASSWORD)

    # Submit the form
    driver.find_element(By.ID, "login_submit_main").click()

    anchor_element = driver.find_element(By.CSS_SELECTOR, '[data-id="10136"] a')
    driver.execute_script("arguments[0].click();", anchor_element)

    time.sleep(2)

    driver.switch_to.window(driver.window_handles[-1])

    view_teesheet_link = driver.find_element(
        By.CSS_SELECTOR, 'a[ui-sref="view-teesheet"]'
    )
    driver.execute_script("arguments[0].scrollIntoView();", view_teesheet_link)
    driver.execute_script("arguments[0].click();", view_teesheet_link)


def go_to_teesheet(driver, wait, scraper_type: str):
    """Navigate to the tee sheet page based on scraper type."""
    if scraper_type == "1757":
        go_to_teesheet_1757(driver, wait)
    else:
        raise ValueError(f"Unknown scraper type: {scraper_type}")


# ============================================================================
# Club-aware functions
# ============================================================================


def get_club_config(supabase: Client, club_id: str) -> dict:
    """Fetch club configuration from database."""
    result = supabase.table("clubs").select("*").eq("id", club_id).single().execute()
    return result.data


def get_club_groups(supabase: Client, club_id: str) -> list[dict]:
    """Fetch all groups belonging to a club."""
    result = (
        supabase.table("groups").select("id, name").eq("club_id", club_id).execute()
    )
    return result.data


def get_all_club_members(supabase: Client, club_id: str) -> dict[str, dict]:
    """
    Fetch all members (real and pending) across all groups in a club.
    Returns dict mapping normalized_name -> {user_id, group_id, invitation_id}
    Uses is_primary flag to determine which group gets the tee time.
    Includes pending members from unclaimed invitations.
    """
    # Get groups for this club
    club_groups = get_club_groups(supabase, club_id)
    club_group_ids = {g["id"] for g in club_groups}

    if not club_group_ids:
        return {}

    # Fetch memberships with is_primary flag (real members)
    result = (
        supabase.table("memberships")
        .select(
            "user_id, group_id, is_primary, profiles!inner(id, full_name, normalized_name)"
        )
        .execute()
    )

    # Build member lookup - prefer primary group
    members = {}
    for member in result.data:
        if member["group_id"] not in club_group_ids:
            continue

        profile = member["profiles"]
        normalized = profile.get("normalized_name") or normalize_name(
            profile.get("full_name", "")
        )
        if not normalized:
            continue

        # If member not seen yet, or this is their primary group, use this membership
        if normalized not in members or member.get("is_primary"):
            members[normalized] = {
                "user_id": profile["id"],
                "group_id": member["group_id"],
                "invitation_id": None,
            }

    # Fetch pending invitations (unclaimed group_member invitations)
    invitations_result = (
        supabase.table("invitations")
        .select("id, group_id, display_name")
        .eq("invitation_type", "group_member")
        .is_("claimed_by", "null")
        .execute()
    )

    for invitation in invitations_result.data:
        if invitation["group_id"] not in club_group_ids:
            continue

        display_name = invitation.get("display_name")
        if not display_name:
            continue

        normalized = normalize_name(display_name)
        if not normalized:
            continue

        # Only add if not already a real member (real members take precedence)
        if normalized not in members:
            members[normalized] = {
                "user_id": None,
                "group_id": invitation["group_id"],
                "invitation_id": invitation["id"],
            }

    return members


def find_lottery_won_tee_times(
    tee_sheet: list[dict], club_members: dict[str, dict]
) -> list[dict]:
    """
    Find tee times where any club member (real or pending) won the lottery.
    Returns list with group_id (primary group) and invitation_id for each match.
    """
    won_tee_times = []
    for entry in tee_sheet:
        for golfer in entry["golfers"]:
            if not golfer or golfer == "* BLOCKED *":
                continue
            normalized = normalize_name(golfer)
            if normalized in club_members:
                member_info = club_members[
                    normalized
                ]  # Already resolved to primary group
                won_tee_times.append(
                    {
                        "tee_time": entry["tee_time"],
                        "won_by_user_id": member_info["user_id"],
                        "won_by_name": golfer,
                        "group_id": member_info["group_id"],
                        "invitation_id": member_info["invitation_id"],
                    }
                )
                break
    return won_tee_times


def get_or_create_weekend(supabase: Client, tee_date: str) -> str:
    """
    Get or create a weekend record that contains the given date.
    Returns the weekend UUID.
    """
    date_obj = datetime.date.fromisoformat(tee_date)

    # Find the Saturday of this weekend
    days_since_saturday = (date_obj.weekday() + 2) % 7
    saturday = date_obj - datetime.timedelta(days=days_since_saturday)
    sunday = saturday + datetime.timedelta(days=1)

    # Check if weekend exists
    result = (
        supabase.table("weekends")
        .select("id")
        .eq("start_date", saturday.isoformat())
        .eq("end_date", sunday.isoformat())
        .execute()
    )

    if result.data:
        return result.data[0]["id"]

    # Create new weekend
    result = (
        supabase.table("weekends")
        .insert({"start_date": saturday.isoformat(), "end_date": sunday.isoformat()})
        .execute()
    )

    return result.data[0]["id"]


def sync_single_tee_time(
    supabase: Client, group_id: str, weekend_id: str, tee_date: str, tee_time_info: dict
):
    """Create a single tee_time entry for a lottery-won slot."""
    time_value = parse_time(tee_time_info["tee_time"])

    # Upsert tee time - makes it available to the group
    supabase.table("tee_times").upsert(
        {
            "weekend_id": weekend_id,
            "tee_date": tee_date,
            "tee_time": time_value,
            "group_id": group_id,
            "max_players": 4,
        },
        on_conflict="weekend_id,tee_date,tee_time,group_id",
    ).execute()


def store_raw_tee_sheet(
    supabase: Client, club_id: str, tee_date: str, tee_sheet: list[dict]
):
    """Store the raw tee sheet data for audit purposes."""
    supabase.table("external_tee_sheets").insert(
        {"club_id": club_id, "scraped_date": tee_date, "raw_data": tee_sheet}
    ).execute()


def process_day(
    driver,
    wait,
    supabase: Client,
    club_id: str,
    club_members: dict[str, dict],
    day_of_week: int,
    day_name: str,
) -> int:
    """Process a single day's tee sheet for a club."""
    print(f"\nProcessing {day_name}...")

    # Select the day and get the date
    tee_date = select_upcoming_day(driver, wait, day_of_week)
    print(f"  Date: {tee_date}")

    time.sleep(2)  # Wait for page to load

    # Extract tee times
    tee_sheet = extract_tee_times(driver.page_source)
    print(f"  Found {len(tee_sheet)} total tee time slots")

    # Find lottery-won tee times (now includes group_id for each)
    won_tee_times = find_lottery_won_tee_times(tee_sheet, club_members)
    print(f"  Found {len(won_tee_times)} tee times won by club members")

    if won_tee_times:
        # Get or create weekend
        weekend_id = get_or_create_weekend(supabase, tee_date)

        # Group won tee times by group_id for reporting
        by_group = {}
        for tt in won_tee_times:
            gid = tt["group_id"]
            if gid not in by_group:
                by_group[gid] = []
            by_group[gid].append(tt)

        # Sync each tee time to appropriate group
        for tt in won_tee_times:
            sync_single_tee_time(supabase, tt["group_id"], weekend_id, tee_date, tt)
            member_type = "pending" if tt["invitation_id"] else "member"
            print(
                f"    - {tt['tee_time']} -> group {tt['group_id'][:8]}... (won by {tt['won_by_name']} [{member_type}])"
            )

    # Store raw data for audit
    store_raw_tee_sheet(supabase, club_id, tee_date, tee_sheet)

    return len(won_tee_times)


def main():
    """Main entry point for the ETL pipeline."""
    print("=" * 50)
    print("Golf Club Tee Sheet ETL Pipeline")
    print("=" * 50)

    # Validate configuration
    if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, CLUB_ID]):
        print("Error: Missing required environment variables.")
        print("Please set SUPABASE_URL, SUPABASE_SERVICE_KEY, and CLUB_ID")
        return

    if not all([GOLF_CLUB_USERNAME, GOLF_CLUB_PASSWORD]):
        print("Error: Missing golf club credentials.")
        print("Please set GOLF_CLUB_USERNAME and GOLF_CLUB_PASSWORD")
        return

    # Initialize Supabase client
    print("\nConnecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Get club configuration
    print(f"Fetching club configuration for {CLUB_ID}...")
    club_config = get_club_config(supabase, CLUB_ID)
    print(f"Processing club: {club_config['name']}")
    print(f"Scraper type: {club_config['scraper_type']}")

    # Get all groups for this club
    club_groups = get_club_groups(supabase, CLUB_ID)
    print(f"Found {len(club_groups)} groups in this club:")
    for g in club_groups:
        print(f"  - {g['name']} ({g['id'][:8]}...)")

    if not club_groups:
        print(
            "Error: No groups found for this club. Please associate groups with the club first."
        )
        return

    # Get all members across all groups in this club
    print("\nFetching members across all groups...")
    club_members = get_all_club_members(supabase, CLUB_ID)
    print(f"Found {len(club_members)} unique members")

    if not club_members:
        print("Warning: No club members found. No tee times will be matched.")

    # Initialize browser
    print("\nStarting browser...")
    driver = create_driver()
    wait = WebDriverWait(driver, 10)

    try:
        # Navigate to tee sheet using club-specific scraper
        print(f"Logging into {club_config['name']}...")
        go_to_teesheet(driver, wait, club_config["scraper_type"])

        total_won = 0

        # Process Saturday (day_of_week=5)
        total_won += process_day(
            driver, wait, supabase, CLUB_ID, club_members, 5, "Saturday"
        )

        # Process Sunday (day_of_week=6)
        total_won += process_day(
            driver, wait, supabase, CLUB_ID, club_members, 6, "Sunday"
        )

        print("\n" + "=" * 50)
        print(f"ETL Complete! Synced {total_won} lottery-won tee times")
        print("=" * 50)

    except Exception as e:
        print(f"\nError during ETL: {e}")
        raise

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
