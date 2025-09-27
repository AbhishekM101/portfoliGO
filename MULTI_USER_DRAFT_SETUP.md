# Multi-User Real-Time Draft Setup Guide

## 🎯 Overview
This guide will help you set up multi-user real-time drafting functionality for your fantasy stocks league. Multiple users can now join the same league from different devices and participate in live drafts together.

## 📋 Prerequisites
- Supabase project set up
- Basic league system already implemented
- All users have accounts and can join leagues

## 🗄️ Step 1: Database Setup

### Run the Database Extension Script
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `draft_system_extension.sql`
3. Execute the script

This will create:
- `draft_sessions` table - tracks active drafts
- `draft_picks` table - records all draft selections
- `user_rosters` table - stores each user's drafted stocks
- Real-time subscriptions and RLS policies
- Database functions for draft management

## 🔧 Step 2: Frontend Integration

### New Files Created:
- `src/services/draftService.ts` - Real-time draft API service
- Updated `src/pages/Draft.tsx` - Multi-user draft interface

### Key Features Implemented:

#### Real-Time Updates
- ✅ Live draft session updates
- ✅ Real-time pick notifications
- ✅ Automatic roster synchronization
- ✅ Multi-user turn management

#### Draft Controls
- ✅ Start/Pause/Resume/Reset draft
- ✅ Turn-based picking system
- ✅ Real-time draft order display
- ✅ Live pick tracking

#### User Experience
- ✅ Loading states and error handling
- ✅ Turn indicators and notifications
- ✅ Real-time roster updates
- ✅ Draft progress tracking

## 🚀 Step 3: Testing Multi-User Draft

### Test Scenario:
1. **Create a League** (as commissioner)
2. **Invite Users** to join the league
3. **Start Draft** from the league details page
4. **Multiple Users** can now participate in real-time

### How It Works:

#### For League Commissioners:
1. Go to League Details page
2. Click "Start Draft" button
3. Draft session begins with all league members
4. Control draft (pause/resume/reset) as needed

#### For All Users:
1. Navigate to `/league/{leagueId}/draft`
2. See real-time draft board
3. When it's your turn, draft stocks
4. Watch other users' picks in real-time
5. View your roster updates automatically

## 🔄 Real-Time Features

### Live Updates:
- **Draft Status**: Active/Paused/Completed
- **Current Pick**: Who's on the clock
- **Recent Picks**: Latest selections
- **Draft Progress**: Completion percentage
- **User Rosters**: Automatic updates

### Turn Management:
- Only current user can draft
- Visual indicators for whose turn it is
- Automatic turn progression
- Real-time notifications

## 🛠️ Technical Implementation

### Database Functions:
- `start_draft_session(league_uuid)` - Starts a new draft
- `make_draft_pick(session_uuid, stock_symbol, stock_data)` - Records a pick

### Real-Time Subscriptions:
- Draft session updates
- Draft picks updates  
- User roster updates
- League member updates

### Security:
- Row Level Security (RLS) policies
- User authentication required
- League membership validation
- Turn-based access control

## 🎮 Usage Instructions

### Starting a Draft:
1. **Commissioner** goes to league details
2. Clicks "Start Draft" button
3. All league members can now access the draft
4. Draft begins with first team on the clock

### During the Draft:
1. **Current team** sees "Draft" buttons enabled
2. **Other teams** see "Not Your Turn" on buttons
3. **All users** see real-time updates
4. **Picks** are recorded and synced instantly

### Draft Completion:
1. **Automatic** when all picks are made
2. **League status** changes to "season_active"
3. **All rosters** are finalized
4. **Users** can view their teams

## 🔧 Troubleshooting

### Common Issues:

#### "User is not a member of this league"
- Ensure user has joined the league
- Check league membership in database

#### "Not your turn to pick"
- Wait for your turn in the draft order
- Check if draft is active

#### "Stock already drafted"
- Stock was already selected by another user
- Choose a different stock

#### Real-time updates not working
- Check Supabase connection
- Verify RLS policies
- Ensure user is authenticated

## 📊 Database Schema

### Key Tables:
```sql
draft_sessions (id, league_id, status, current_pick, current_team_index, ...)
draft_picks (id, draft_session_id, pick_number, team_id, stock_id, stock_data, ...)
user_rosters (id, league_id, user_id, stock_id, stock_data, draft_position, ...)
```

### Relationships:
- `draft_sessions` → `leagues`
- `draft_picks` → `draft_sessions` + `league_members`
- `user_rosters` → `leagues` + `users`

## 🎉 Success!

Your fantasy stocks league now supports:
- ✅ Multi-user real-time drafting
- ✅ Live updates across all devices
- ✅ Turn-based pick management
- ✅ Automatic roster synchronization
- ✅ Professional draft experience

Users can now join leagues from different devices and participate in live drafts together, just like ESPN Fantasy!
