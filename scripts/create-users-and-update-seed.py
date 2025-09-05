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
]


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
    if days_until_saturday == 0 and today.weekday() != 5:  # If today is not Saturday, get next Saturday
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
    this_weekend_start_str = this_weekend_start.strftime('%Y-%m-%d')
    this_weekend_end_str = this_weekend_end.strftime('%Y-%m-%d')
    next_weekend_start_str = next_weekend_start.strftime('%Y-%m-%d')
    next_weekend_end_str = next_weekend_end.strftime('%Y-%m-%d')
    weekend_after_next_start_str = weekend_after_next_start.strftime('%Y-%m-%d')
    weekend_after_next_end_str = weekend_after_next_end.strftime('%Y-%m-%d')
    weekend_month_start_str = weekend_month_start.strftime('%Y-%m-%d')
    weekend_month_end_str = weekend_month_end.strftime('%Y-%m-%d')
    weekend_no_tee_times_start_str = weekend_no_tee_times_start.strftime('%Y-%m-%d')
    weekend_no_tee_times_end_str = weekend_no_tee_times_end.strftime('%Y-%m-%d')

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
        (
            "550e8400-e29b-41d4-a716-446655440300",
            "781eb1d0-4968-4b4a-b648-c951c31ebd4f",
            "550e8400-e29b-41d4-a716-446655440001",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440190",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440001",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440191",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440002",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440192",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440003",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440193",
            "550e8400-e29b-41d4-a716-446655440100",
            "550e8400-e29b-41d4-a716-446655440004",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440194",
            "550e8400-e29b-41d4-a716-446655440101",
            "550e8400-e29b-41d4-a716-446655440001",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440195",
            "550e8400-e29b-41d4-a716-446655440101",
            "550e8400-e29b-41d4-a716-446655440002",
            "admin",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440196",
            "550e8400-e29b-41d4-a716-446655440101",
            "550e8400-e29b-41d4-a716-446655440003",
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440200",
            "550e8400-e29b-41d4-a716-446655440102",
            "550e8400-e29b-41d4-a716-446655440001",
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440201",
            "550e8400-e29b-41d4-a716-446655440103",
            "550e8400-e29b-41d4-a716-446655440002",
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440202",
            "550e8400-e29b-41d4-a716-446655440104",
            "550e8400-e29b-41d4-a716-446655440003",
            "member",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440203",
            "550e8400-e29b-41d4-a716-446655440105",
            "550e8400-e29b-41d4-a716-446655440004",
            "member",
        ),
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
    content += "INSERT INTO interests (id, user_id, walking, riding, partners, game_type, notes) VALUES\n"

    interests = [
        (
            "550e8400-e29b-41d4-a716-446655440300",
            "550e8400-e29b-41d4-a716-446655440102",
            False,
            True,
            "Mike Johnson, Tom Davis",
            "Scramble",
            "Prefer early morning tee times",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440301",
            "550e8400-e29b-41d4-a716-446655440103",
            True,
            False,
            "Sarah Wilson",
            "Best Ball",
            "Walking only, flexible on partners",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440302",
            "550e8400-e29b-41d4-a716-446655440104",
            False,
            True,
            "David Brown, Emma Champion",
            "Scramble",
            "Weekend warriors, prefer afternoon",
        ),
        (
            "550e8400-e29b-41d4-a716-446655440303",
            "550e8400-e29b-41d4-a716-446655440105",
            True,
            True,
            "Lisa Player",
            "Individual",
            "Flexible on format, love the game",
        ),
    ]

    interest_lines = []
    for (
        interest_id,
        expected_user_id,
        walking,
        riding,
        partners,
        game_type,
        notes,
    ) in interests:
        if expected_user_id in id_mapping:
            actual_user_id = id_mapping[expected_user_id]
            interest_lines.append(
                f"  ('{interest_id}', '{actual_user_id}', {walking}, {riding}, '{partners}', '{game_type}', '{notes}')"
            )

    if interest_lines:
        content += ",\n".join(interest_lines) + ";\n\n"

    # Add assignments
    content += "-- Insert sample assignments for member users\n"
    content += "INSERT INTO assignments (id, weekend_id, user_id, tee_time_id) VALUES\n"

    assignments = [
        # Group A assignments (This Weekend - Saturday 8:00 AM)
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
        (
            "550e8400-e29b-41d4-a716-446655440405",
            "550e8400-e29b-41d4-a716-446655440010",
            "550e8400-e29b-41d4-a716-446655440106",
            "550e8400-e29b-41d4-a716-446655440020",
        ),
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
