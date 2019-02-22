import React from 'react';
import { Link, graphql } from 'gatsby';
import g from 'glamorous';
import Layout from '../components/Layout';

const IndexPage = ({ data }) => (
  <Layout data={data}>
    <div>
      <h4>{data.allMarkdownRemark.totalCount} Posts</h4>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <div key={node.id}>
          <Link
            to={node.fields.slug}
            css={{ textDecoration: `none`, color: `inherit` }}
          >
            <g.H3 marginBottom="1rem">
              {node.frontmatter.title}{' '}
              <g.Span color="#BBB">— {node.frontmatter.date}</g.Span>
            </g.H3>
            <p>{node.excerpt}</p>
          </Link>
        </div>
      ))}
    </div>
  </Layout>
);

export default IndexPage;

export const query = graphql`
  query IndexQuery {
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "/^(?!/posts-zh_cn)/" } } }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
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
