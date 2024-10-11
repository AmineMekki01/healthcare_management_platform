import styled from 'styled-components';

export const PostContainer = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const PostHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;

`;

export const PostAuthorInfoContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;

`;

export const PostAuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const GoToPostActionButton = styled.button`
  padding: 10px;
  border: 1px solid #f2f2f2;
  border-radius: 5px;

  &:hover {
    background-color: #f2f2f2;
    color: black;
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
`;

export const PostTimestamp = styled.div`
  font-size: 0.9em;
  color: #777;
`;

export const PostTitle = styled.h2`

  margin: 10px auto;
  font-size: 20px;
`;

export const PostContent = styled.div`
  margin-bottom: 10px;
  padding: 15px;

`;

export const PostActions = styled.div`
  display: flex;
  align-items: left;
  flex-direction: column;
  border-top: 2px solid #ddd;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
`;

export const PostStats = styled.div`
  display: flex;
`;

export const ActionButton = styled.button`
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

export const LikesCount = styled.span`
  color: #6DAE4F;
  padding: 10px;

`;

export const CommentsCount = styled.span`
  color: #378FE9;
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

export const PostMetadata = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const SpecialtyTag = styled.span`
  background-color: #007bff;
  width: fit-content;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9em;
  margin-right: 10px;
`;

export const KeywordsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
`;

export const KeywordTag = styled.span`
  background-color: #f0f0f0;
  color: #333;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  margin-right: 5px;
  margin-bottom: 5px;
`;