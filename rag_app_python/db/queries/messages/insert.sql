-- :name insert_message :insert
INSERT INTO chatbot_messages (id, chat_id, model, user_id, agent_role, user_message, answer) VALUES (:id, :chat_id, :model, :user_id, :agent_role, :user_message, :answer);

-- :name insert_chat :insert

INSERT INTO chatbot_chats (id, user_id, title, model, agent_role, created_at, updated_at) VALUES (:id, :user_id, :title, :model, :agent_role, :created_at, :updated_at);

-- :name insert_file :insert
INSERT INTO chatbot_files (id, chat_id, user_id, file_name, file_size, file_type) VALUES (:id, :chat_id, :user_id, :file_name, :file_size, :file_type);

