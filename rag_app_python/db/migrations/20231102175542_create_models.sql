-- migrate:up

CREATE TABLE messages (
    id uuid PRIMARY KEY,
    chat_id uuid NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    agent_role VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE chats (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    title VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    agent_role VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE files (
    id uuid PRIMARY KEY,
    chat_id uuid NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(255) NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- migrate:down
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
DROP TABLE if EXISTS files;