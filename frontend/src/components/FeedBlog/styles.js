import styled from 'styled-components';

export const PostContainer = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

export const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f2f5;
`;

export const PostAuthorInfoContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const PostAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const GoToPostActionButton = styled.button`
  padding: 8px 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3a7bc8;
  }
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
  font-size: 16px;
`;

export const PostTimestamp = styled.div`
  font-size: 12px;
  color: #65676b;
`;

export const PostContent = styled.div`
  padding: 15px;
  font-size: 16px;
  line-height: 1.5;
`;

export const PostActions = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f0f2f5;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 10px;
`;

export const PostStats = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #f0f2f5;
  font-size: 14px;
`;

export const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  color: #65676b;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f0f2f5;
    border-radius: 20px;
  }

  svg {
    margin-right: 5px;
  }
`;

export const LikesCount = styled.span`
  color: #4a90e2;
`;

export const CommentsCount = styled.span`
  color: #4a90e2;
`;

export const PostMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 10px 15px;
  background-color: #f0f2f5;
`;

export const SpecialtyTag = styled.span`
  background-color: #4a90e2;
  color: white;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  margin-right: 10px;
`;

export const KeywordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

export const KeywordTag = styled.span`
  background-color: #e4e6eb;
  color: #050505;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  margin-right: 5px;
  margin-bottom: 5px;
`;

export const EditButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  padding: 10px;
  width: 100%;
  &:hover {
    text-decoration: underline;
    background-color: #ddd;
  }
`;
export const DeleteButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  padding: 10px;
  width: 100%;
  &:hover {
    text-decoration: underline;
    background-color: #ddd;
  }
`;
export const CommonStatCount = styled.span`
  padding: 10px;
`;

export const CommentsContainer = styled.div`
  margin-top: 10px;
  padding: 10px;
`;

export const Comment = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-top: 1px solid #ddd;
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

export const DoctorPostsContainer = styled.div`
  width: 60%;

  min-width: 250px;
  margin: auto;
`;

export const DoctorPostsTitle = styled.div`
  text-align: center;
  font-size: 25px;
  font-weight: bold;
  padding: 20px;
`;

export const PostTitle = styled.h2`

  margin: 10px auto;
  font-size: 20px;
`;