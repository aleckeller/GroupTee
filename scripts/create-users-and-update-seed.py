#!/usr/bin/env python3
"""
Script to create users and generate updated seed data
Run with: python scripts/create-users-and-update-seed.py
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client

# Try to load from .env file if it exists
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# User data with expected IDs for reference
test_users = [
    {
        "email": "john.admin@example.com",
        "password": "password123",
        "full_name": "John Admin",
        "expected_id": "550e8400-e29b-41d4-a716-446655440100",
    },
    {
        "email": "sarah.manager@example.com",
        "password": "password123",
        "full_name": "Sarah Manager",
        "expected_id": "550e8400-e29b-41d4-a716-446655440101",
    },
    {
        "email": "alec.keller@example.com",
        "password": "password123",
        "full_name": "Alec Keller Admin",
        "expected_id": "781eb1d0-4968-4b4a-b648-c951c31ebd4f",
    },
    {
        "email": "mike.golfer@example.com",
        "password": "password123",
        "full_name": "Mike Golfer",
        "expected_id": "550e8400-e29b-41d4-a716-446655440102",
    },
    {
        "email": "lisa.player@example.com",
        "password": "password123",
        "full_name": "Lisa Player",
        "expected_id": "550e8400-e29b-41d4-a716-446655440103",
    },
    {
        "email": "david.pro@example.com",
        "password": "password123",
        "full_name": "David Pro",
        "expected_id": "550e8400-e29b-41d4-a716-446655440104",
    },
    {
        "email": "emma.champion@example.com",
        "password": "password123",
        "full_name": "Emma Champion",
        "expected_id": "550e8400-e29b-41d4-a716-446655440105",
    },
    {
        "email": "tom.visitor@example.com",
        "password": "password123",
        "full_name": "Tom Visitor",
        "expected_id": "550e8400-e29b-41d4-a716-446655440106",
    },
    {
        "email": "anna.newcomer@example.com",
        "password": "password123",
        "full_name": "Anna Newcomer",
        "expected_id": "550e8400-e29b-41d4-a716-446655440107",
    },
    {
        "email": "bob.spectator@example.com",
        "password": "password123",
        "full_name": "Bob Spectator",
        "expected_id": "550e8400-e29b-41d4-a716-446655440108",
    },
    # Additional diverse test users
    {
        "email": "jessica.morning@example.com",
        "password": "password123",
        "full_name": "Jessica Morning",
        "expected_id": "550e8400-e29b-41d4-a716-446655440109",
    },
    {
        "email": "robert.walker@example.com",
        "password": "password123",
        "full_name": "Robert Walker",
        "expected_id": "550e8400-e29b-41d4-a716-446655440110",
    },
    {
        "email": "maria.guest@example.com",
        "password": "password123",
        "full_name": "Maria Guest",
        "expected_id": "550e8400-e29b-41d4-a716-446655440111",
    },
    {
        "email": "steve.afternoon@example.com",
        "password": "password123",
        "full_name": "Steve Afternoon",
        "expected_id": "550e8400-e29b-41d4-a716-446655440112",
    },
    {
        "email": "linda.partner@example.com",
        "password": "password123",
        "full_name": "Linda Partner",
        "expected_id": "550e8400-e29b-41d4-a716-446655440113",
    },
    {
        "email": "chris.flexible@example.com",
        "password": "password123",
        "full_name": "Chris Flexible",
        "expected_id": "550e8400-e29b-41d4-a716-446655440114",
    },
    {
        "email": "amanda.early@example.com",
        "password": "password123",
        "full_name": "Amanda Early",
        "expected_id": "550e8400-e29b-41d4-a716-446655440115",
    },
    {
        "email": "kevin.late@example.com",
        "password": "password123",
        "full_name": "Kevin Late",
        "expected_id": "550e8400-e29b-41d4-a716-446655440116",
    },
    {
        "email": "sophie.social@example.com",
        "password": "password123",
        "full_name": "Sophie Social",
        "expected_id": "550e8400-e29b-41d4-a716-446655440117",
    },
    {
        "email": "marcus.solo@example.com",
        "password": "password123",
        "full_name": "Marcus Solo",
        "expected_id": "550e8400-e29b-41d4-a716-446655440118",
    },
    {
        "email": "rachel.family@example.com",
        "password": "password123",
        "full_name": "Rachel Family",
        "expected_id": "550e8400-e29b-41d4-a716-446655440119",
    },
    {
        "email": "daniel.business@example.com",
        "password": "password123",
        "full_name": "Daniel Business",
        "expected_id": "550e8400-e29b-41d4-a716-446655440120",
    },
]

# Create name-to-ID mapping for partners
name_to_id_mapping = {
    "John Admin": "550e8400-e29b-41d4-a716-446655440100",
    "Sarah Manager": "550e8400-e29b-41d4-a716-446655440101",
    "Alec Keller Admin": "781eb1d0-4968-4b4a-b648-c951c31ebd4f",
    "Mike Golfer": "550e8400-e29b-41d4-a716-446655440102",
    "Lisa Player": "550e8400-e29b-41d4-a716-446655440103",
    "David Pro": "550e8400-e29b-41d4-a716-446655440104",
    "Emma Champion": "550e8400-e29b-41d4-a716-446655440105",
    "Tom Visitor": "550e8400-e29b-41d4-a716-446655440106",
    "Anna Newcomer": "550e8400-e29b-41d4-a716-446655440107",
    "Bob Spectator": "550e8400-e29b-41d4-a716-446655440108",
    "Jessica Morning": "550e8400-e29b-41d4-a716-446655440109",
    "Robert Walker": "550e8400-e29b-41d4-a716-446655440110",
    "Maria Evening": "550e8400-e29b-41d4-a716-446655440111",
    "Sarah Wilson": "550e8400-e29b-41d4-a716-446655440112",
    "Chris Flexible": "550e8400-e29b-41d4-a716-446655440114",
    "Amanda Early": "550e8400-e29b-41d4-a716-446655440115",
    "Kevin Late": "550e8400-e29b-41d4-a716-446655440116",
    "Sophie Social": "550e8400-e29b-41d4-a716-446655440117",
    "Marcus Solo": "550e8400-e29b-41d4-a716-446655440118",
    "Rachel Family": "550e8400-e29b-41d4-a716-446655440119",
    "Daniel Business": "550e8400-e29b-41d4-a716-446655440120",
}


def convert_partners_to_ids(partners_str):
    """Convert partner names to JSON array of member IDs"""
    if not partners_str:
        return None

    # Split by comma and map names to IDs
    partner_names = [name.strip() for name in partners_str.split(",")]
    partner_ids = []

    for name in partner_names:
        if name in name_to_id_mapping:
            partner_ids.append(name_to_id_mapping[name])
        else:
            print(f"Warning: Unknown partner name '{name}' - skipping")

    return partner_ids if partner_ids else None


async def verify_users_in_auth_table(created_users):
    """Verify that all created users exist in the auth.users table"""
    verified_count = 0

    for user in created_users:
        try:
            # Try to get the user by ID
            response = supabase.auth.admin.get_user_by_id(user["actual_id"])

            if response and hasattr(response, "user") and response.user:
                print(f"   ✓ {user['email']} exists in auth.users")
                verified_count += 1
            else:
                print(f"   ❌ {user['email']} NOT found in auth.users")

        except Exception as e:
            print(f"   ❌ Error verifying {user['email']}: {e}")

    print(
        f"\n📊 Verification complete: {verified_count}/{len(created_users)} users verified in auth.users"
    )

    if verified_count == len(created_users):
        print("✅ All users successfully created in auth.users table!")
    else:
        print("⚠️  Some users may not have been created properly in auth.users table")


async def create_users_and_generate_seed():
    print("Creating users in auth.users and generating updated seed data...")

    created_users = []

    for user in test_users:
        try:
            print(f"Creating user: {user['email']}...")

            response = supabase.auth.admin.create_user(
                {
                    "email": user["email"],
                    "password": user["password"],
                    "email_confirm": True,  # Skip email confirmation for test users
                    "user_metadata": {"full_name": user["full_name"]},
                }
            )

            if hasattr(response, "user") and response.user:
                actual_id = response.user.id
                created_users.append(
                    {
                        "email": user["email"],
                        "full_name": user["full_name"],
                        "actual_id": actual_id,
                        "expected_id": user["expected_id"],
                    }
                )
                print(f"✅ Created in auth.users: {user['email']} → {actual_id}")

                # Verify the user was actually created in auth.users
                try:
                    verify_response = supabase.auth.admin.get_user_by_id(actual_id)
                    if (
                        verify_response
                        and hasattr(verify_response, "user")
                        and verify_response.user
                    ):
                        print(f"   ✓ Verified in auth.users table")
                    else:
                        print(f"   ⚠️  Warning: User not found in auth.users table")
                except Exception as verify_error:
                    print(
                        f"   ⚠️  Warning: Could not verify user in auth.users: {verify_error}"
                    )

            else:
                print(f"❌ Failed to create: {user['email']}")
                if hasattr(response, "error"):
                    print(f"   Error: {response.error}")

        except Exception as e:
            print(f"❌ Error creating {user['email']}: {e}")

    if not created_users:
        print("No users were created successfully.")
        return

    print(f"\n📊 Summary: Created {len(created_users)} users in auth.users")

    # List all created users for verification
    print("\n🔍 Created users in auth.users:")
    for user in created_users:
        print(f"   - {user['email']} (ID: {user['actual_id']})")

    # Verify all users exist in auth.users table
    print("\n🔍 Verifying users in auth.users table...")
    await verify_users_in_auth_table(created_users)

    # Generate the complete seed.sql content
    seed_content = generate_seed_content(created_users)

    # Write to the supabase/seed.sql file
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    seed_file_path = project_root / "supabase" / "seed.sql"

    try:
        with open(seed_file_path, "w") as f:
            f.write(seed_content)
        print(f"\n✅ Successfully generated updated seed.sql at: {seed_file_path}")
        print(f"\n📋 Summary:")
        print(f"   - Created {len(created_users)} users in auth.users")
        print(f"   - Generated updated seed.sql with correct user IDs")
        print(f"   - All relationships (memberships, interests, etc.) updated")
        print(f"\n🚀 Next steps:")
        print(f"   1. Run: supabase db reset")
        print(
            f"   2. Your test users can now log in with their email addresses and password 'password123'"
        )
    except Exception as e:
        print(f"❌ Error writing seed file: {e}")
        print(f"\nGenerated content (copy this to your seed.sql file):")
        print("=" * 80)
        print(seed_content)
        print("=" * 80)


def generate_seed_content(created_users):
    """Generate the complete seed.sql content with actual user IDs"""

    # Create mapping for easy lookup
    id_mapping = {user["expected_id"]: user["actual_id"] for user in created_users}

    # Calculate dynamic weekend dates
    from datetime import datetime, timedelta

    today = datetime.now()

    # Find the next Saturday (this weekend)
    days_until_saturday = (5 - today.weekday()) % 7
    if (
        days_until_saturday == 0 and today.weekday() != 5
    ):  # If today is not Saturday, get next Saturday
        days_until_saturday = 7

    this_weekend_start = today + timedelta(days=days_until_saturday)
    this_weekend_end = this_weekend_start + timedelta(days=1)

    # Next weekend
    next_weekend_start = this_weekend_start + timedelta(days=7)
    next_weekend_end = next_weekend_start + timedelta(days=1)

    # Weekend after next (for upcoming weekends section)
    weekend_after_next_start = this_weekend_start + timedelta(days=14)
    weekend_after_next_end = weekend_after_next_start + timedelta(days=1)

    # Weekend in a month
    weekend_month_start = this_weekend_start + timedelta(days=28)
    weekend_month_end = weekend_month_start + timedelta(days=1)

    # Weekend without tee times (for testing)
    weekend_no_tee_times_start = this_weekend_start + timedelta(days=35)
    weekend_no_tee_times_end = weekend_no_tee_times_start + timedelta(days=1)

    # Format dates as strings
    this_weekend_start_str = this_weekend_start.strftime("%Y-%m-%d")
    this_weekend_end_str = this_weekend_end.strftime("%Y-%m-%d")
    next_weekend_start_str = next_weekend_start.strftime("%Y-%m-%d")
    next_weekend_end_str = next_weekend_end.strftime("%Y-%m-%d")
    weekend_after_next_start_str = weekend_after_next_start.strftime("%Y-%m-%d")
    weekend_after_next_end_str = weekend_after_next_end.strftime("%Y-%m-%d")
    weekend_month_start_str = weekend_month_start.strftime("%Y-%m-%d")
    weekend_month_end_str = weekend_month_end.strftime("%Y-%m-%d")
    weekend_no_tee_times_start_str = weekend_no_tee_times_start.strftime("%Y-%m-%d")
    weekend_no_tee_times_end_str = weekend_no_tee_times_end.strftime("%Y-%m-%d")

    # Start building the seed content
    content = f"""-- Seed data for Golf Weekend Tee Times App
-- This file populates the database with sample data for testing
-- Generated automatically with actual user IDs from auth.users
-- Weekend dates calculated dynamically: This Weekend ({this_weekend_start_str}), Next Weekend ({next_weekend_start_str}), Weekend After Next ({weekend_after_next_start_str}), Weekend in Month ({weekend_month_start_str}), Weekend No Tee Times ({weekend_no_tee_times_start_str})

-- Temporarily disable foreign key constraints for testing
-- WARNING: This is only for development/testing purposes
SET session_replication_role = replica;

-- Insert sample groups
INSERT INTO groups (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Group A'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Group B'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Group C'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Group D');

-- Insert sample weekends (dynamic dates for relative weekend labels)
INSERT INTO weekends (id, start_date, end_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '{this_weekend_start_str}', '{this_weekend_end_str}'),
  ('550e8400-e29b-41d4-a716-446655440011', '{next_weekend_start_str}', '{next_weekend_end_str}'),
  ('550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_start_str}', '{weekend_after_next_end_str}'),
  ('550e8400-e29b-41d4-a716-446655440013', '{weekend_month_start_str}', '{weekend_month_end_str}'),
  ('550e8400-e29b-41d4-a716-446655440014', '{weekend_no_tee_times_start_str}', '{weekend_no_tee_times_end_str}');

-- Insert sample tee times for This Weekend
INSERT INTO tee_times (id, weekend_id, tee_date, tee_time, group_id, max_players) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_start_str}', '08:00:00', '550e8400-e29b-41d4-a716-446655440001', 3),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_start_str}', '08:10:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_start_str}', '08:20:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_start_str}', '08:30:00', '550e8400-e29b-41d4-a716-446655440004', 4),
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_end_str}', '08:00:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_end_str}', '08:10:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_end_str}', '08:20:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440010', '{this_weekend_end_str}', '08:30:00', '550e8400-e29b-41d4-a716-446655440004', 4);

-- Insert sample tee times for Next Weekend
INSERT INTO tee_times (id, weekend_id, tee_date, tee_time, group_id, max_players) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_start_str}', '07:30:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_start_str}', '07:45:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_start_str}', '08:00:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_start_str}', '08:15:00', '550e8400-e29b-41d4-a716-446655440004', 4),
  ('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_end_str}', '08:00:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_end_str}', '08:15:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_end_str}', '08:30:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440011', '{next_weekend_end_str}', '08:45:00', '550e8400-e29b-41d4-a716-446655440004', 4);

-- Insert sample tee times for Weekend After Next
INSERT INTO tee_times (id, weekend_id, tee_date, tee_time, group_id, max_players) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_start_str}', '08:30:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_start_str}', '08:45:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_start_str}', '09:00:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_start_str}', '09:15:00', '550e8400-e29b-41d4-a716-446655440004', 4),
  ('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_end_str}', '08:30:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440012', '{weekend_after_next_end_str}', '08:45:00', '550e8400-e29b-41d4-a716-446655440002', 4);

-- Insert sample tee times for Weekend in Month
INSERT INTO tee_times (id, weekend_id, tee_date, tee_time, group_id, max_players) VALUES
  ('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440013', '{weekend_month_start_str}', '09:00:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440013', '{weekend_month_start_str}', '09:15:00', '550e8400-e29b-41d4-a716-446655440002', 4),
  ('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440013', '{weekend_month_start_str}', '09:30:00', '550e8400-e29b-41d4-a716-446655440003', 4),
  ('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440013', '{weekend_month_end_str}', '09:00:00', '550e8400-e29b-41d4-a716-446655440001', 4),
  ('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440013', '{weekend_month_end_str}', '09:15:00', '550e8400-e29b-41d4-a716-446655440002', 4);


-- Note: Profiles are automatically created via database trigger when users are created in auth.users
-- No need to manually insert profiles here
"""

    # Add memberships
    content += "-- Insert admin memberships (admins can manage all groups)\n"
    content += "INSERT INTO memberships (id, user_id, group_id, role) VALUES\n"

    memberships = [
        # Group A (Primary Group) - Most users assigned here
        (
            "550e8400-e29b-41d4-a716-446655440300",
            "781eb1d0-4968-4b4a-b648-c951c31ebd4f",  # Alec Keller Admin
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440190",
            "550e8400-e29b-41d4-a716-446655440100",  # John Admin
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440194",
            "550e8400-e29b-41d4-a716-446655440101",  # Sarah Manager
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "admin",
        ),
        # Group A Members
        (
            "550e8400-e29b-41d4-a716-446655440200",
            "550e8400-e29b-41d4-a716-446655440102",  # Mike Golfer
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440201",
            "550e8400-e29b-41d4-a716-446655440103",  # Lisa Player
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440202",
            "550e8400-e29b-41d4-a716-446655440104",  # David Pro
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440203",
            "550e8400-e29b-41d4-a716-446655440105",  # Emma Champion
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        # Additional Group A Members
        (
            "550e8400-e29b-41d4-a716-446655440204",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440205",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440206",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440207",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440208",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440209",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440210",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440211",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440212",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440213",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440214",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440215",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            "550e8400-e29b-41d4-a716-446655440001",  # Group A
            "member",
        ),
        # Guest users (no memberships) - Tom Visitor, Anna Newcomer, Bob Spectator
        # These users exist but have no group memberships, so they can't access the app
    ]

    membership_lines = []
    for membership_id, expected_user_id, group_id, role in memberships:
        if expected_user_id in id_mapping:
            actual_user_id = id_mapping[expected_user_id]
            membership_lines.append(
                f"  ('{membership_id}', '{actual_user_id}', '{group_id}', '{role}')"
            )

    if membership_lines:
        content += ",\n".join(membership_lines) + ";\n\n"

    # Add interests
    content += "-- Insert sample interests for member users\n"
    content += "INSERT INTO interests (id, user_id, interest_date, wants_to_play, time_preference, transportation, partners, guest_count, notes) VALUES\n"

    # Get current date and create some sample dates
    from datetime import datetime, timedelta

    today = datetime.now().date()
    this_weekend_start = today + timedelta(
        days=(5 - today.weekday()) % 7
    )  # Next Saturday
    this_weekend_end = this_weekend_start + timedelta(days=1)  # Sunday
    next_weekend_start = this_weekend_start + timedelta(days=7)  # Following Saturday
    next_weekend_end = next_weekend_start + timedelta(days=1)  # Following Sunday

    interests = [
        # This weekend - Saturday
        (
            "550e8400-e29b-41d4-a716-446655440300",
            "550e8400-e29b-41d4-a716-446655440102",  # Mike Golfer
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            "Mike Johnson, Tom Davis",
            1,  # guest_count
            "Prefer early morning tee times",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440301",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Robert Walker, Maria Guest",
            0,  # guest_count
            "Early bird, love walking the course",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440302",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Jessica Morning",
            0,  # guest_count
            "Walking enthusiast, prefer morning rounds",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440303",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Jessica Morning, Robert Walker",
            2,  # guest_count
            "Bringing my husband and son",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440304",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Linda Partner",
            1,  # guest_count
            "Afternoon rounds work better for my schedule",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440305",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Steve Afternoon",
            0,  # guest_count
            "Love afternoon rounds, walking keeps me fit",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440306",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            None,
            0,  # guest_count
            "Flexible on time and partners",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440307",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Early morning is my favorite time to play",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440308",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Late afternoon works best for me",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440309",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Love playing with friends, social aspect is important",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440310",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Prefer walking, enjoy the solitude",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440311",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            3,  # guest_count
            "Family golf day - bringing my kids and spouse",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440312",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            this_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Business networking on the course",
        ),
        # This weekend - Sunday
        (
            "550e8400-e29b-41d4-a716-446655440313",
            "550e8400-e29b-41d4-a716-446655440103",  # Lisa Player
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "walking",
            "Sarah Wilson",
            0,  # guest_count
            "Walking only, flexible on partners",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440314",
            "550e8400-e29b-41d4-a716-446655440104",  # David Pro
            this_weekend_end.strftime("%Y-%m-%d"),
            False,
            None,
            None,
            None,
            0,  # guest_count
            None,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440315",
            "550e8400-e29b-41d4-a716-446655440105",  # Emma Champion
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Lisa Player",
            1,  # guest_count
            "Early morning rounds, walking preferred",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440316",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Sunday morning golf tradition",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440317",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Jessica Morning, Emma Champion",
            0,  # guest_count
            "Weekend walking rounds are the best",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440318",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Steve Afternoon, Linda Partner",
            1,  # guest_count
            "Sunday afternoon with friends",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440319",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Sunday afternoon rounds are perfect",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440320",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Walking on Sunday afternoons",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440321",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            None,
            0,  # guest_count
            "Flexible on everything, just want to play",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440322",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Early Sunday morning golf",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440323",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            2,  # guest_count
            "Late afternoon with guests",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440324",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Social golf on Sundays",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440325",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Sunday morning walking rounds",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440326",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            2,  # guest_count
            "Family Sunday golf",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440327",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            this_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Sunday business networking",
        ),
        # Next weekend - Saturday
        (
            "550e8400-e29b-41d4-a716-446655440328",
            "550e8400-e29b-41d4-a716-446655440102",  # Mike Golfer
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            "Jessica Morning, Robert Walker",
            1,  # guest_count
            "Next weekend early round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440329",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Robert Walker",
            0,  # guest_count
            "Next weekend morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440330",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Jessica Morning",
            0,  # guest_count
            "Next weekend walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440331",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Steve Afternoon, Linda Partner",
            3,  # guest_count
            "Next weekend with extended family",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440332",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Next weekend afternoon round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440333",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Next weekend walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440334",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            None,
            0,  # guest_count
            "Next weekend flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440335",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Next weekend early morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440336",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Next weekend late afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440337",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Next weekend social round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440338",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Next weekend solo walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440339",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            2,  # guest_count
            "Next weekend family golf",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440340",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            next_weekend_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Next weekend business golf",
        ),
        # Next weekend - Sunday
        (
            "550e8400-e29b-41d4-a716-446655440341",
            "550e8400-e29b-41d4-a716-446655440103",  # Lisa Player
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Next weekend walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440342",
            "550e8400-e29b-41d4-a716-446655440104",  # David Pro
            next_weekend_end.strftime("%Y-%m-%d"),
            False,
            None,
            None,
            None,
            0,  # guest_count
            None,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440343",
            "550e8400-e29b-41d4-a716-446655440105",  # Emma Champion
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Lisa Player",
            1,  # guest_count
            "Next weekend morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440344",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Next weekend Sunday morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440345",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Jessica Morning, Emma Champion",
            0,  # guest_count
            "Next weekend Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440346",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Steve Afternoon, Linda Partner",
            2,  # guest_count
            "Next weekend Sunday with friends",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440347",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Next weekend Sunday afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440348",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Next weekend Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440349",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            None,
            0,  # guest_count
            "Next weekend flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440350",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Next weekend early Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440351",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Next weekend late Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440352",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Next weekend social Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440353",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Next weekend solo Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440354",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            3,  # guest_count
            "Next weekend family Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440355",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            next_weekend_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Next weekend business Sunday",
        ),
        # Weekend After Next - Saturday (2025-10-11)
        (
            "550e8400-e29b-41d4-a716-446655440356",
            "550e8400-e29b-41d4-a716-446655440102",  # Mike Golfer
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            "Jessica Morning, Robert Walker",
            2,  # guest_count
            "Weekend after next early round with guests",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440357",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Robert Walker",
            0,  # guest_count
            "Weekend after next morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440358",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Jessica Morning",
            0,  # guest_count
            "Weekend after next walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440359",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Steve Afternoon, Linda Partner",
            1,  # guest_count
            "Weekend after next with family",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440360",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Weekend after next afternoon round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440361",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Weekend after next walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440362",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            None,
            0,  # guest_count
            "Weekend after next flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440363",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Weekend after next early morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440364",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Weekend after next late afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440365",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Weekend after next social round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440366",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Weekend after next solo walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440367",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            2,  # guest_count
            "Weekend after next family golf",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440368",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            weekend_after_next_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Weekend after next business golf",
        ),
        # Weekend After Next - Sunday (2025-10-12)
        (
            "550e8400-e29b-41d4-a716-446655440369",
            "550e8400-e29b-41d4-a716-446655440103",  # Lisa Player
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Weekend after next walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440370",
            "550e8400-e29b-41d4-a716-446655440104",  # David Pro
            weekend_after_next_end.strftime("%Y-%m-%d"),
            False,
            None,
            None,
            None,
            0,  # guest_count
            None,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440371",
            "550e8400-e29b-41d4-a716-446655440105",  # Emma Champion
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Lisa Player",
            1,  # guest_count
            "Weekend after next morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440372",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Weekend after next Sunday morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440373",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Jessica Morning, Emma Champion",
            0,  # guest_count
            "Weekend after next Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440374",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Steve Afternoon, Linda Partner",
            2,  # guest_count
            "Weekend after next Sunday with friends",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440375",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Weekend after next Sunday afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440376",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Weekend after next Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440377",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            None,
            0,  # guest_count
            "Weekend after next flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440378",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Weekend after next early Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440379",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Weekend after next late Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440380",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Weekend after next social Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440381",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Weekend after next solo Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440382",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            3,  # guest_count
            "Weekend after next family Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440383",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            weekend_after_next_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Weekend after next business Sunday",
        ),
        # Weekend in Month - Saturday (2025-10-25)
        (
            "550e8400-e29b-41d4-a716-446655440384",
            "550e8400-e29b-41d4-a716-446655440102",  # Mike Golfer
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            "Jessica Morning, Robert Walker",
            1,  # guest_count
            "Weekend in month early round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440385",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Robert Walker",
            0,  # guest_count
            "Weekend in month morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440386",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Mike Golfer, Jessica Morning",
            0,  # guest_count
            "Weekend in month walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440387",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Steve Afternoon, Linda Partner",
            2,  # guest_count
            "Weekend in month with family",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440388",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Weekend in month afternoon round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440389",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Weekend in month walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440390",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "riding",
            None,
            0,  # guest_count
            "Weekend in month flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440391",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Weekend in month early morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440392",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Weekend in month late afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440393",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Weekend in month social round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440394",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Weekend in month solo walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440395",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            2,  # guest_count
            "Weekend in month family golf",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440396",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            weekend_month_start.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Weekend in month business golf",
        ),
        # Weekend in Month - Sunday (2025-10-26)
        (
            "550e8400-e29b-41d4-a716-446655440397",
            "550e8400-e29b-41d4-a716-446655440103",  # Lisa Player
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Weekend in month walking round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440398",
            "550e8400-e29b-41d4-a716-446655440104",  # David Pro
            weekend_month_end.strftime("%Y-%m-%d"),
            False,
            None,
            None,
            None,
            0,  # guest_count
            None,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440399",
            "550e8400-e29b-41d4-a716-446655440105",  # Emma Champion
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Lisa Player",
            1,  # guest_count
            "Weekend in month morning walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440400",
            "550e8400-e29b-41d4-a716-446655440109",  # Jessica Morning
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Emma Champion",
            0,  # guest_count
            "Weekend in month Sunday morning",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440401",
            "550e8400-e29b-41d4-a716-446655440110",  # Robert Walker
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Jessica Morning, Emma Champion",
            0,  # guest_count
            "Weekend in month Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440402",
            "550e8400-e29b-41d4-a716-446655440111",  # Maria Guest
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Steve Afternoon, Linda Partner",
            1,  # guest_count
            "Weekend in month Sunday with friends",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440403",
            "550e8400-e29b-41d4-a716-446655440112",  # Steve Afternoon
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Maria Guest, Linda Partner",
            0,  # guest_count
            "Weekend in month Sunday afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440404",
            "550e8400-e29b-41d4-a716-446655440113",  # Linda Partner
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "walking",
            "Maria Guest, Steve Afternoon",
            0,  # guest_count
            "Weekend in month Sunday walk",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440405",
            "550e8400-e29b-41d4-a716-446655440114",  # Chris Flexible
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            None,
            0,  # guest_count
            "Weekend in month flexible round",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440406",
            "550e8400-e29b-41d4-a716-446655440115",  # Amanda Early
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Kevin Late",
            0,  # guest_count
            "Weekend in month early Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440407",
            "550e8400-e29b-41d4-a716-446655440116",  # Kevin Late
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "late-afternoon",
            "riding",
            "Amanda Early",
            1,  # guest_count
            "Weekend in month late Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440408",
            "550e8400-e29b-41d4-a716-446655440117",  # Sophie Social
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "mid-morning",
            "riding",
            "Marcus Solo, Rachel Family",
            0,  # guest_count
            "Weekend in month social Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440409",
            "550e8400-e29b-41d4-a716-446655440118",  # Marcus Solo
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "morning",
            "walking",
            "Sophie Social",
            0,  # guest_count
            "Weekend in month solo Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440410",
            "550e8400-e29b-41d4-a716-446655440119",  # Rachel Family
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Sophie Social, Daniel Business",
            3,  # guest_count
            "Weekend in month family Sunday",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440411",
            "550e8400-e29b-41d4-a716-446655440120",  # Daniel Business
            weekend_month_end.strftime("%Y-%m-%d"),
            True,
            "afternoon",
            "riding",
            "Rachel Family",
            1,  # guest_count
            "Weekend in month business Sunday",
        ),
    ]

    interest_lines = []
    for (
        interest_id,
        expected_user_id,
        interest_date,
        wants_to_play,
        time_preference,
        transportation,
        partners,
        guest_count,
        notes,
    ) in interests:
        if expected_user_id in id_mapping:
            actual_user_id = id_mapping[expected_user_id]
            wants_to_play_str = (
                "true"
                if wants_to_play
                else "false" if wants_to_play is False else "NULL"
            )
            time_pref_str = f"'{time_preference}'" if time_preference else "NULL"
            transport_str = f"'{transportation}'" if transportation else "NULL"

            # Convert partners from names to JSON array of IDs
            if partners:
                partner_ids = convert_partners_to_ids(partners)
                if partner_ids:
                    import json

                    partners_str = f"'{json.dumps(partner_ids)}'"
                else:
                    partners_str = "NULL"
            else:
                partners_str = "NULL"
            guest_count_str = str(guest_count) if guest_count is not None else "0"
            notes_str = f"'{notes}'" if notes else "NULL"
            interest_lines.append(
                f"  ('{interest_id}', '{actual_user_id}', '{interest_date}', {wants_to_play_str}, {time_pref_str}, {transport_str}, {partners_str}, {guest_count_str}, {notes_str})"
            )

    if interest_lines:
        content += ",\n".join(interest_lines) + ";\n\n"

    # Add assignments
    content += "-- Insert sample assignments for member users\n"
    content += "INSERT INTO assignments (id, weekend_id, user_id, tee_time_id) VALUES\n"

    assignments = [
        # Group A assignments (This Weekend - Saturday 8:00 AM) - Max 3 players
        (
            "550e8400-e29b-41d4-a716-446655440400",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440102",
            "550e8400-e29b-41d4-a716-446655440020",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440404",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440020",
        ),
        # Removed third assignment to prevent overbooking (max 3 players)
        # Group A assignments (This Weekend - Sunday 8:00 AM)
        (
            "550e8400-e29b-41d4-a716-446655440406",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440102",
            "550e8400-e29b-41d4-a716-446655440024",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440407",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440107",
            "550e8400-e29b-41d4-a716-446655440024",
        ),
        # Group A assignments (Next Weekend - Saturday 7:30 AM)
        (
            "550e8400-e29b-41d4-a716-446655440408",
            "550e8400-e29b-41d4-a716-446655440011",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440030",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440409",
            "550e8400-e29b-41d4-a716-446655440011",
            "550e8400-e29b-41d4-a716-446655440102",
            "550e8400-e29b-41d4-a716-446655440030",
        ),
        # Other group assignments (This Weekend)
        (
            "550e8400-e29b-41d4-a716-446655440401",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440103",
            "550e8400-e29b-41d4-a716-446655440021",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440402",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440104",
            "550e8400-e29b-41d4-a716-446655440022",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440403",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440105",
            "550e8400-e29b-41d4-a716-446655440023",
        ),
        # Next Weekend assignments
        (
            "550e8400-e29b-41d4-a716-446655440412",
            "550e8400-e29b-41d4-a716-446655440011",
            "550e8400-e29b-41d4-a716-446655440103",
            "550e8400-e29b-41d4-a716-446655440031",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440413",
            "550e8400-e29b-41d4-a716-446655440011",
            "550e8400-e29b-41d4-a716-446655440104",
            "550e8400-e29b-41d4-a716-446655440032",
        ),
        # Weekend After Next assignments
        (
            "550e8400-e29b-41d4-a716-446655440414",
            "550e8400-e29b-41d4-a716-446655440012",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440040",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440415",
            "550e8400-e29b-41d4-a716-446655440012",
            "550e8400-e29b-41d4-a716-446655440102",
            "550e8400-e29b-41d4-a716-446655440040",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440416",
            "550e8400-e29b-41d4-a716-446655440012",
            "550e8400-e29b-41d4-a716-446655440103",
            "550e8400-e29b-41d4-a716-446655440041",
        ),
        # Weekend in Month assignments
        (
            "550e8400-e29b-41d4-a716-446655440417",
            "550e8400-e29b-41d4-a716-446655440013",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440050",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440418",
            "550e8400-e29b-41d4-a716-446655440013",
            "550e8400-e29b-41d4-a716-446655440104",
            "550e8400-e29b-41d4-a716-446655440050",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440419",
            "550e8400-e29b-41d4-a716-446655440013",
            "550e8400-e29b-41d4-a716-446655440105",
            "550e8400-e29b-41d4-a716-446655440051",
        ),
    ]

    assignment_lines = []
    for (
        assignment_id,
        weekend_id,
        expected_user_id,
        tee_time_id,
    ) in assignments:
        if expected_user_id in id_mapping:
            actual_user_id = id_mapping[expected_user_id]
            assignment_lines.append(
                f"  ('{assignment_id}', '{weekend_id}', '{actual_user_id}', '{tee_time_id}')"
            )

    if assignment_lines:
        content += ",\n".join(assignment_lines) + ";\n\n"

    # Add trades
    content += "-- Insert sample group-to-group trades for testing\n"
    content += "INSERT INTO trades (id, weekend_id, from_group_id, to_group_id, from_tee_time_id, to_tee_time_id, initiated_by, status) VALUES\n"

    trades = [
        (
            "550e8400-e29b-41d4-a716-446655440500",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440001",
            "550e8400-e29b-41d4-a716-446655440002",
            "550e8400-e29b-41d4-a716-446655440020",
            "550e8400-e29b-41d4-a716-446655440021",
            "550e8400-e29b-41d4-a716-446655440100",
            "pending",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440501",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440003",
            "550e8400-e29b-41d4-a716-446655440004",
            "550e8400-e29b-41d4-a716-446655440022",
            "550e8400-e29b-41d4-a716-446655440023",
            "550e8400-e29b-41d4-a716-446655440101",
            "accepted",
        ),
    ]

    trade_lines = []
    for (
        trade_id,
        weekend_id,
        from_group_id,
        to_group_id,
        from_tee_time_id,
        to_tee_time_id,
        expected_initiated_by,
        status,
    ) in trades:
        if expected_initiated_by in id_mapping:
            actual_initiated_by = id_mapping[expected_initiated_by]
            trade_lines.append(
                f"  ('{trade_id}', '{weekend_id}', '{from_group_id}', '{to_group_id}', '{from_tee_time_id}', '{to_tee_time_id}', '{actual_initiated_by}', '{status}')"
            )

    if trade_lines:
        content += ",\n".join(trade_lines) + ";\n\n"

    # Add notifications
    content += "-- Insert sample notifications\n"
    content += "INSERT INTO notifications (id, user_id, message, read) VALUES\n"

    notifications = [
        (
            "550e8400-e29b-41d4-a716-446655440600",
            "550e8400-e29b-41d4-a716-446655440102",
            "Your tee time has been confirmed for Saturday at 8:00 AM on North Course",
            False,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440601",
            "550e8400-e29b-41d4-a716-446655440103",
            "New trade request from Mike Golfer",
            False,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440602",
            "550e8400-e29b-41d4-a716-446655440104",
            "Your tee time has been moved to 8:20 AM due to course maintenance",
            True,
        ),
        (
            "550e8400-e29b-41d4-a716-446655440603",
            "550e8400-e29b-41d4-a716-446655440105",
            "Welcome to the Spring Golf Weekend!",
            False,
        ),
    ]

    notification_lines = []
    for notification_id, expected_user_id, message, read in notifications:
        if expected_user_id in id_mapping:
            actual_user_id = id_mapping[expected_user_id]
            notification_lines.append(
                f"  ('{notification_id}', '{actual_user_id}', '{message}', {read})"
            )

    if notification_lines:
        content += ",\n".join(notification_lines) + ";\n\n"

    # Add footer
    content += """-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Test data summary:
-- Admin users: 2 (John Admin - admin of all groups, Sarah Manager - admin of A&B, member of C)
-- Member users: 4 (Mike Golfer, Lisa Player, David Pro, Emma Champion)
-- Guest users: 3 (Tom Visitor, Anna Newcomer, Bob Spectator - no memberships)
-- 
-- This gives you a good mix of users to test:
-- - Role-based navigation (roles determined by memberships)
-- - Screen access permissions
-- - Admin role management
-- - Different user capabilities
-- - Users with different roles in different groups (Sarah Manager example)
-- 
-- Users can log in with their email addresses and password 'password123'
"""

    return content


def main():
    import asyncio

    asyncio.run(create_users_and_generate_seed())


if __name__ == "__main__":
    main()
