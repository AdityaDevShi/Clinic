import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BlogPost } from '@/lib/types';

export const BlogService = {
    async getPosts(): Promise<BlogPost[]> {
        try {
            const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                } as BlogPost;
            });
        } catch (error) {
            console.error('Error loading blog posts:', error);
            return [];
        }
    },
};
