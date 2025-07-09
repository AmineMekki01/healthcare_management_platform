import styled from 'styled-components';

export const PostContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 
    0 16px 32px rgba(0, 0, 0, 0.06),
    0 8px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 24px 48px rgba(0, 0, 0, 0.1),
      0 12px 24px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
`;

export const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
`;

export const PostAuthorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const PostAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const GoToPostActionButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const PostAuthorAvatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    transform: scale(1.05);
  }
`;

export const PostAuthorName = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
  letter-spacing: 0.3px;
`;

export const PostTimestamp = styled.div`
  font-size: 13px;
  color: #718096;
  font-weight: 500;
`;

export const PostContent = styled.div`
  padding: 24px 28px;
  font-size: 16px;
  line-height: 1.7;
  color: #4a5568;
  
  h1, h2, h3 {
    color: #2c3e50;
    margin: 16px 0 12px;
    font-weight: 700;
  }
  
  p {
    margin-bottom: 16px;
  }
  
  strong {
    color: #2c3e50;
    font-weight: 700;
  }
  
  em {
    font-style: italic;
    color: #667eea;
  }
  
  ul, ol {
    margin: 16px 0;
    padding-left: 24px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

export const PostActions = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: #fafbfc;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 16px 28px;
  gap: 12px;
`;

export const PostStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 14px;
  font-weight: 600;
`;

export const ActionButton = styled.button`
  background: transparent;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  flex: 1;
  justify-content: center;

  &:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-color: rgba(102, 126, 234, 0.3);
    color: #667eea;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 16px;
  }
`;

export const LikesCount = styled.span`
  color: #667eea;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '👍';
    font-size: 16px;
  }
`;

export const CommentsCount = styled.span`
  color: #764ba2;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '💬';
    font-size: 16px;
  }
`;

export const PostMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 20px 28px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
`;

export const SpecialtyTag = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
`;

export const KeywordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const KeywordTag = styled.span`
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
  }
`;

export const EditButton = styled.button`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 12px;
  width: 100%;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const DeleteButton = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 12px;
  width: 100%;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const CommonStatCount = styled.span`
  padding: 12px 16px;
  color: #64748b;
  font-weight: 600;
`;

export const CommentsContainer = styled.div`
  margin-top: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
`;

export const Comment = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.4);
  
  &:last-child {
    border-bottom: none;
  }
`;

export const CommentAvatar = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(102, 126, 234, 0.2);
`;

export const CommentContent = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
`;

export const CommentAuthor = styled.div`
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 14px;
`;

export const CommentText = styled.div`
  margin-bottom: 8px;
  color: #4a5568;
  line-height: 1.6;
  font-size: 14px;
`;

export const CommentTimestamp = styled.div`
  font-size: 12px;
  color: #718096;
  font-weight: 500;
`;

export const AddCommentForm = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
`;

export const AddCommentInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e8ecf0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
`;

export const AddCommentButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const DoctorPostsContainer = styled.div`
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
`;

export const DoctorPostsTitle = styled.div`
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  padding: 40px 20px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
`;

export const PostTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.3;
  letter-spacing: -0.02em;
  position: relative;
  
  &:hover {
    color: #667eea;
    transition: color 0.3s ease;
  }
`;