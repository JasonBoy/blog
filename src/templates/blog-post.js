import React from 'react';
import glamorous from 'glamorous';

const Article = glamorous.article({
  '& :not(pre) > code[class*="language-"]': {
    paddingLeft: 7,
    paddingRight: 7,
  },
});

export default ({ data }) => {
  const post = data.markdownRemark;
  return (
    <div>
      <h1>{post.frontmatter.title}</h1>
      <Article lineHeight={'1.8rem'} fontSize={'1.25rem'}>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </Article>
    </div>
  );
};

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`;
