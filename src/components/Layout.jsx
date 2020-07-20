import React from 'react';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';

import 'prismjs/themes/prism-tomorrow.css';

import Header from './Header';
import Footer from './Footer';
import * as PropTypes from 'prop-types';

const Layout = ({ children }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={(data) => (
      <>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            { name: 'description', content: data.site.siteMetadata.title },
            {
              name: 'keywords',
              content: 'jason, blog, lovemily, node, javascript',
            },
          ]}
        />
        <Header siteTitle={data.site.siteMetadata.title} />
        <div
          style={{
            margin: '0 auto',
            maxWidth: 960,
            padding: '1.45rem 1rem',
          }}
        >
          {children}
        </div>
        <Footer siteTitle={data.site.siteMetadata.title} />
      </>
    )}
  />
);

Layout.propTypes = {
  children: PropTypes.func,
};

export default Layout;
