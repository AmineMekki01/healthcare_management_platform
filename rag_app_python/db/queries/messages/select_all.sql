-- :name select_all :many
SELECT 
    * 
FROM 
    chatbot_messages 
WHERE 
    user_id = :user_id 
ORDER BY 
    created_at 
DESC;

-- :name select_chats_by_user :many
SELECT 
    c.id, 
    c.user_id, 
    c.title,
    c.model, 
    c.agent_role,
    c.updated_at,
    c.created_at
FROM 
    chatbot_chats c 
WHERE 
    user_id = :user_id 
ORDER BY 
    c.created_at 
DESC;

-- :name select_messages_by_chat :many
SELECT 
  m.id,
  m.user_id,
  m.model,
  m.agent_role,
  m.user_message,
  m.answer,
  m.created_at
FROM chatbot_messages m
INNER JOIN chatbot_chats c ON m.chat_id = c.id
WHERE c.id = :chat_id
ORDER BY m.created_at;