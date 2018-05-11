import React from 'react';
import Link from 'gatsby-link';

const IndexPage = () => (
  <div>
    <h1>Hi people</h1>
    <h3>This is Jason's blog</h3>
    <Link to="/about/">Go to About</Link>
  </div>
);

export default IndexPage;
