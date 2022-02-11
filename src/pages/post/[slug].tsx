import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { FiUser, FiClock } from 'react-icons/fi';
import { AiOutlineCalendar } from 'react-icons/ai';
import { RichText } from 'prismic-dom';
import ptBR from 'date-fns/locale/pt-BR';
import styles from './post.module.scss';
import { format } from 'date-fns';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  // TODO

  function getReadingTime(): number {
    const regexPattern = /[^\w]/;
    const totalWords = post.data.content.reduce((acc, item) => {
      const totaHeadinglWords = item.heading?.split(regexPattern).length ?? 0;

      const totalBodyWords = item.body.reduce((bodyAcc, bodyItem) => {
        return bodyAcc + bodyItem.text.split(regexPattern).length;
      }, 0);

      return acc + totaHeadinglWords + totalBodyWords;
    }, 0);

    return Math.round(totalWords / 200);
  }

  return (
    <article className={styles.container}>
      <img src={post.data.banner.url} alt={post.data.title} />

      <div className={styles.info}>
        <h1>{post.data.title}</h1>

        <div className={styles.text_info}>
          <span className={styles.icon}>
            <AiOutlineCalendar width={20} />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
          </span>

          <span className={styles.icon}>
            <FiUser width={20} />
            <span>{post.data.author}</span>
          </span>

          <span className={styles.icon}>
            <FiClock width={20} />
            <span>{getReadingTime()} min</span>
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {post.data.content.map(content => (
          <div
            className={styles.content_text}
            key={(Math.random() * 9999999).toString()}
          >
            <h2>{content.heading}</h2>

            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {}
  );

  const slugsParams = postsResponse.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths: slugsParams,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'post',
    String(context.params.slug),
    {}
  );

  return {
    props: { post: response },
  };
};
