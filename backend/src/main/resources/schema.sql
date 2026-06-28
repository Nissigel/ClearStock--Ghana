ALTER TABLE seller_profiles ALTER COLUMN market_hub DROP NOT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_high_urgency BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS deal_alerts (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    category VARCHAR(255),
    max_price NUMERIC(15,2),
    keywords VARCHAR(255),
    location VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE deal_alerts ADD COLUMN IF NOT EXISTS buyer_id BIGINT;
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE notifications ALTER COLUMN category DROP NOT NULL;
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id),
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    reviewee_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_review_transaction_reviewer UNIQUE (transaction_id, reviewer_id)
);
