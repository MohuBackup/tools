// 公用类型

type Time = Date | string

interface CreationBase {
    author?: UserObjLike,  // 如果为null，则为匿名
    body: string,
    publishTime: Time,
    modifyTime: Time,
}

// 标签相关

type TagId = number

export interface Tag {
    "tag-id": TagId;
    "tag-name": string;
}

// 用户相关

type UserId = number

export interface AvatarUrlObj {
    "user-url": string;
    "user-name": string;
    avatar?: string;
}

export interface UserObj extends AvatarUrlObj {
    "user-id": UserId;
    "user-description"?: string;
}

export interface UserObjSimplified {
    "user-id": UserId;
    "user-name": string;
}

export type UserObjLike = UserObjSimplified | UserObj | UserId

/**
 * 如果只能获取到用户数量，则为number
 */
export type Users = UserObjLike[] | number


// 评论相关

export interface CommentDetail extends CreationBase {
    // 似乎需要的就这些了
}

/**
 * 如果有评论的具体内容，则为CommentDetail[], 如果只能获取到评论数量，则为number
 */
export type Comments = CommentDetail[] | number


// 回答相关

export interface AnswerDetail extends CreationBase {
    "agree-by": UserObjLike[] | number,
    comments: Comments,
    "using-mobile-phone"?: boolean,  // 是否使用手机评论，如果是，问题旁会有一个小小的手机图标
}


// 问题/文章相关

type QuestionId = number

interface QuestionStatus {
    "last-active-time": Time, // 最后活跃时间
    views?: number,
    concerns?: Users // 关注者
}

export interface QuestionDetail extends CreationBase {
    title: string,
    link?: string,
    comments: Comments,
}

export interface Question {
    type: "question",  // 固定值
    id: QuestionId,
    tags: TagId[] | Tag[],
    detail: QuestionDetail,
    answers: AnswerDetail[],
    relatedQuestions: Question[] | QuestionId[],
    questionStatus: QuestionStatus,
}

