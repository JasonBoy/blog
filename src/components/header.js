import React from 'react';
import Link from 'gatsby-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import palette from '../utils/palette';
import { css } from 'glamor';
import g from 'glamorous';
import logo from '../assets/logo.jpg';

const h1Style = css({
  margin: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const Header = ({ siteTitle }) => (
  <div
    style={{
      background: palette.brandPrimary,
      marginBottom: '1.45rem',
    }}
  >
    <div
      style={{
        margin: '0 auto',
        maxWidth: 960,
        padding: '1.45rem 1.0875rem',
      }}
    >
      <h1 className={h1Style}>
        <Link
          to="/"
          className={css({
            color: palette.textPrimary,
            textDecoration: 'none',
            '& > img, & > span': {
              display: 'inline-block',
              verticalAlign: 'middle',
            },
          })}
        >
          <g.Img
            src={logo}
            width="40"
            height="40"
            marginBottom={0}
            marginRight={5}
          />
          <g.Span>{siteTitle}</g.Span>
        </Link>
        <a
          className={css({
            color: palette.textPrimary,
          })}
          href="https://github.com/JasonBoy"
          target="_blank"
        >
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </h1>
    </div>
  </div>
);

export default Header;
