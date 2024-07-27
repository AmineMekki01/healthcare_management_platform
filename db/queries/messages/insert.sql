-- :name insert_message :insert
INSERT INTO messages (
    id, 
    chat_id, 
    model, 
    user_id, 
    agent_role, 
    user_message, 
    medical_history_answer,
    medical_images_interpretation_answer,
    lab_test_results_answer,
    diagnostic_expert_answer)
VALUES (:id, :chat_id, :model, :user_id, :agent_role, :user_message, :medical_history_answer, :medical_images_interpretation_answer, :lab_test_results_answer, :diagnostic_expert_answer);

-- :name insert_chat :insert

INSERT INTO chats (id, user_id, title, model, agent_role, created_at, updated_at)
VALUES (:id, :user_id, :title, :model, :agent_role, :created_at, :updated_at);

-- :name insert_file :insert
INSERT INTO files (id, chat_id, message_id, user_id, file_name, file_size, file_type, file_url) VALUES (:id, :chat_id, :message_id, :user_id, :file_name, :file_size, :file_type, :file_url);
