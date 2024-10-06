import styled from 'styled-components';

export const PostContainer = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 15px;
`;

export const PostHeader = styled.div`
  display: flex;
  align-items: center;
`;

export const PostAuthorAvatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
`;

export const PostAuthorName = styled.div`
  font-weight: bold;
`;

export const PostTimestamp = styled.div`
  font-size: 0.9em;
  color: #777;
`;

export const PostTitle = styled.h2`
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const PostContent = styled.div`
  margin-bottom: 10px;
`;

export const PostActions = styled.div`
  display: flex;
  align-items: center;
`;

export const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    text-decoration: underline;
  }
`;

export const LikesCount = styled.span`
  margin-right: 10px;
`;

export const CommentsCount = styled.span``;

export const CommentsContainer = styled.div`
  margin-top: 10px;
`;

export const Comment = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
`;

export const CommentAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
`;

export const CommentContent = styled.div`
  flex: 1;
`;

export const CommentAuthor = styled.div`
  font-weight: bold;
`;

export const CommentText = styled.div`
  margin-bottom: 5px;
`;

export const CommentTimestamp = styled.div`
  font-size: 0.8em;
  color: #777;
`;

export const AddCommentForm = styled.div`
  display: flex;
  align-items: center;
`;

export const AddCommentInput = styled.input`
  flex: 1;
  padding: 8px;
  margin-right: 10px;
`;

export const AddCommentButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
`;

