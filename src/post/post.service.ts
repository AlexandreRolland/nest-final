import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostCreateDto } from './entity/post-create.dto';
import { PostUpdateDto } from './entity/post-update.dto';
import { PostEntity } from './entity/post.entity';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>
    ) {}

    async getAllPosts(queries) {
        let { page, limit, search, order, published, categories } = queries;

        console.log(categories);
        categories = categories ? categories.split(',') : [];
        console.log(categories);

        limit = limit ? +limit : 10;

        const query = await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.categories', 'categories')
            .leftJoinAndSelect('post.comments', 'comments')
            .orderBy('comments.createdAt', 'DESC')

        if(categories.length > 0) {
            query.andWhere('categories.id IN (:...categories)', { categories })
        }

        if(published !== undefined) {
            query
                .andWhere('post.published = :published', { published })
        }

        const postList = query
                            .limit(limit)
                            .getMany();

        return postList;
    }
    async getOnePostById(id: number) {
        const post = await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.categories', 'categories')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.id = :id', { id })
            .leftJoinAndSelect('post.comments', 'comments')
            .orderBy('comments.createdAt', 'DESC')
            .getOne();

        return post;
    }
    async createPost(data, user) {
        console.log(user);
        data.author = parseInt(user.id);
        console.log(data);

        try {
            return await this.postRepository.save(data);
        } catch (error) {
            console.log(error);
            throw new Error('Error while creating post');
        }
    }
    async updatePost(id: number, data: PostUpdateDto) {
        const post = await this.postRepository.findOneBy({ id });
        const postUpdate = { ...post, ...data };
        await this.postRepository.save(postUpdate);

        return postUpdate;
    }
    async softDeletePost(id: number) {
        return await this.postRepository.softDelete(id);
    }
}
