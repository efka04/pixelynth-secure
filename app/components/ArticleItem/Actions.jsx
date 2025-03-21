"use client";
import dynamic from "next/dynamic";

const LikeButton = dynamic(() => import('./LikeButton'), { ssr: false });

const ArticleActions = ({ id, likes, className }) => (
  <div className={className}>
    <LikeButton id={id} initialLikes={likes} />
  </div>
);

export default ArticleActions;
