import React from 'react';
import glamorous from 'glamorous';
import Helmet from 'react-helmet';

const Article = glamorous.article({
  '& :not(pre) > code[class*="language-"]': {
    paddingLeft: 7,
    paddingRight: 7,
  },
});

const ArticleWrapper = glamorous.div({
  minHeight: 475,
});

export default ({ data }) => {
  const post = data.markdownRemark;
  const frontMatter = post.frontmatter;
  return (
    <ArticleWrapper>
      <Helmet
        title={frontMatter.title}
        meta={[
          { name: 'description', content: frontMatter.description },
          { name: 'keywords', content: frontMatter.tags.join(',') },
        ]}
      />
      <h1>{post.frontmatter.title}</h1>
      <Article lineHeight={'1.8rem'} fontSize={'1.25rem'}>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </Article>
    </ArticleWrapper>
  );
};

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        description
        tags
      }
    }
  }
`;
