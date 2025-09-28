-- Migration script to add league_settings for existing leagues
-- Run this in your Supabase SQL Editor

-- Insert default league_settings for all existing leagues that don't have them
INSERT INTO league_settings (league_id, risk_weight, growth_weight, value_weight)
SELECT 
    l.id as league_id,
    0.3 as risk_weight,    -- 30% as decimal
    0.4 as growth_weight,  -- 40% as decimal  
    0.3 as value_weight    -- 30% as decimal
FROM leagues l
LEFT JOIN league_settings ls ON l.id = ls.league_id
WHERE ls.league_id IS NULL;

-- Verify the migration
SELECT 
    l.name as league_name,
    l.id as league_id,
    ls.risk_weight,
    ls.growth_weight,
    ls.value_weight,
    CASE 
        WHEN ls.league_id IS NULL THEN 'MISSING SETTINGS'
        ELSE 'HAS SETTINGS'
    END as status
FROM leagues l
LEFT JOIN league_settings ls ON l.id = ls.league_id
ORDER BY l.created_at;
