import react, {useState, useContext} from 'react';
import axios from './../axiosConfig';
import CommentsSection from './CommentsSection';
import {
    PostContainer,
    PostHeader,
    PostAuthorAvatar,
    PostAuthorName,
    PostTimestamp,
    PostTitle,
    PostContent,
    PostActions,
    ActionButton,
    LikesCount,
    CommentsCount,
  } from './styles';
import { AuthContext } from './../Auth/AuthContext';

const BlogPost = ({post}) => {
    const [likes, setLikes] = useState(post.likes_count)
    const [liked, setLiked] = useState(false)
    const [showComments, setShowComments] = useState(false);
    const {userId, userType} = useContext(AuthContext)

    const handleLike = async () => {
        if (!userId && !userType) {
            return
          }
        try {
            if (!liked) {
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${post.post_id}/like`, null, {params : {userType, userId}});
                setLikes(likes + 1)
            } else {
                await axios.post(`http://localhost:3001/api/v1/feed/posts/${post.post_id}/unlike`, null, {params : {userType, userId}});
                setLikes(likes - 1)
            }
            setLiked(!liked);
        } catch (error) {
            console.error('Error updating like status : ', error)
        }
    };

    const toggleComments = () => {
        setShowComments(!showComments);
    };

    return (
        <PostContainer>
            <PostHeader>
            <PostAuthorAvatar src={`http://localhost:3001/${post.doctor_avatar}`} alt={`Dr. ${post.doctor_name}`} />
            <div>
                <PostAuthorName>{post.doctor_name}</PostAuthorName>
                <PostTimestamp>{new Date(post.created_at).toLocaleString()}</PostTimestamp>
            </div>
            </PostHeader>
            <PostTitle>{post.title}</PostTitle>
            <PostContent dangerouslySetInnerHTML={{ __html: post.content }} />
            <PostActions>
            <ActionButton onClick={handleLike}>{liked ? 'Unlike' : 'Like'}</ActionButton>
            <LikesCount>{likes} Likes</LikesCount>
            <ActionButton onClick={toggleComments}>Comments</ActionButton>
            <CommentsCount>{post.comments_count} Comments</CommentsCount>
            </PostActions>
            {showComments && <CommentsSection postId={post.post_id} />}
      </PostContainer>
    );
};

export default BlogPost;