import React from 'react';
import { Link, graphql } from 'gatsby';
import g from 'glamorous';
import { css } from 'glamor';
import Layout from '../components/Layout';

const linkCSS = {
  textDecoration: `none`,
  color: `inherit`,
  transition: '.3s',
  '&:hover': { textDecoration: 'underline' },
};

const IndexPage = ({ data }) => (
  <Layout data={data}>
    <ul className={css({ listStyle: 'none' })}>
      {/*<h4>{data.allMarkdownRemark.totalCount} Posts</h4>*/}
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <li key={node.id} className={css({ marginBottom: 20 })}>
          <Link to={node.fields.slug} css={linkCSS}>
            <g.H3 marginBottom="1rem">
              {node.frontmatter.title}
              {/*<g.Span color="#BBB">— {node.frontmatter.date}</g.Span>*/}
            </g.H3>
          </Link>
          <g.P marginBottom={0} color="gray">
            <small>{node.frontmatter.date}</small>
          </g.P>
          <p>{node.excerpt}</p>
        </li>
      ))}
    </ul>
  </Layout>
);

export default IndexPage;

export const query = graphql`
  query IndexQuery {
    allMarkdownRemark(
      filter: {
        fields: { slug: { regex: "/^(?!/posts-zh_cn)/" } }
        frontmatter: { tags: { nin: ["not-blog"] } }
      }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            tags
            date(formatString: "DD MMMM, YYYY")
          }
          fields {
            slug
          }
          excerpt
        }
      }
    }
  }
`;
