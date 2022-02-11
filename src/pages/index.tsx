import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // TODO
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [currentPage, setCurrentPage] =
    useState<PostPagination>(postsPagination);

  async function NextPage(nextPage: string): Promise<void> {
    const data = await fetch(nextPage).then(response => {
      if (response.ok) {
        return response.json();
      }
    });
    const formatData = {
      next_page: data.next_page,
      results: data.results.map((post: Post) => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      }),
    };

    setCurrentPage(formatData);

    const concat = posts.concat(formatData.results);
    setPosts(concat);
  }

  return (
    <main className={styles.main}>
      {posts.map(post => (
        <article className={styles.post} key={post.uid}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <div className={styles.title}>
                <h1>{post.data.title}</h1>
                <span>{post.data.subtitle}</span>
              </div>
            </a>
          </Link>

          <div className={styles.info}>
            <div>
              <FiCalendar size={20} />
              <span>{post.first_publication_date}</span>
            </div>

            <div>
              <FiUser size={20} />
              <span>{post.data.author}</span>
            </div>
          </div>
        </article>
      ))}

      {currentPage.next_page && (
        <button
          className={styles.loadPosts}
          onClick={() => NextPage(currentPage.next_page)}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.content', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    }),
  };

  return {
    props: {
      postsPagination,
    },
  };
};
