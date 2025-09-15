# Supabase Setup Guide for SwingVista

This guide will help you set up Supabase integration for the SwingVista golf swing analysis system.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `swingvista` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
6. Click "Create new project"
7. Wait for the project to be created (this may take a few minutes)

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder values with your actual credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important**: Replace `your-actual-project-id` and `your-actual-anon-key-here` with the values from Step 2.

## Step 4: Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-setup.sql` (included in this project)
4. Click "Run" to execute the SQL
5. You should see "Table created successfully" message

## Step 5: Test the Connection

1. Install dependencies if not already done:
   ```bash
   npm install dotenv
   ```

2. Run the test script:
   ```bash
   node test-supabase.js
   ```

3. You should see:
   ```
   ✅ Supabase connection successful!
   ✅ Insert operation successful!
   🎉 All tests passed! Supabase is properly configured.
   ```

## Step 6: Verify in Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/api/test-supabase`
3. You should see a successful response instead of a 401 error

## Troubleshooting

### Error: "relation 'swings' does not exist"
- **Solution**: Run the SQL script in `supabase-setup.sql` in your Supabase SQL Editor

### Error: "Invalid API key" or "JWT expired"
- **Solution**: Check that your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct and not expired

### Error: "Missing environment variables"
- **Solution**: Ensure your `.env.local` file exists and contains both required variables

### Error: 401 Unauthorized
- **Solution**: Verify your API credentials are correct and the project is active

## Security Notes

- Never commit your `.env.local` file to version control
- The anon key is safe to use in client-side code
- For production, consider implementing Row Level Security (RLS) policies
- Monitor your Supabase usage in the dashboard

## Next Steps

Once Supabase is configured:
1. Test the upload and camera pages
2. Verify swing data is being saved
3. Check the comparison page shows saved swings
4. Test the swing detail pages

## Support

If you encounter issues:
1. Check the Supabase dashboard for error logs
2. Verify your project is active and not paused
3. Ensure you're using the correct region
4. Check the Supabase documentation for API limits

