import React from 'react';
import g from 'glamorous';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import Layout from '../components/Layout';

const Article = g.article({
  '& :not(pre) > code[class*="language-"]': {
    paddingLeft: 7,
    paddingRight: 7,
  },
});

const ArticleWrapper = g.div({
  minHeight: 475,
});

export default function BlogPost({ data }) {
  const post = data.markdownRemark;
  const frontMatter = post.frontmatter;
  return (
    <Layout data={data}>
      <ArticleWrapper>
        <Helmet
          title={frontMatter.title}
          meta={[
            { name: 'description', content: frontMatter.description },
            { name: 'keywords', content: frontMatter.tags.join(',') },
          ]}
        />
        <g.H1 marginBottom={0}>{post.frontmatter.title}</g.H1>
        <g.P marginBottom={10} color="gray">
          <small>
            <i>{post.frontmatter.date}</i>
          </small>
        </g.P>
        <Article lineHeight={'1.8rem'} fontSize={'1.25rem'}>
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </Article>
      </ArticleWrapper>
    </Layout>
  );
}

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        description
        tags
        date(formatString: "DD MMMM, YYYY")
      }
    }
  }
`;
