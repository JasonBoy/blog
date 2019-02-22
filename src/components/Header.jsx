import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import palette from '../utils/palette';
import { css } from 'glamor';
import g from 'glamorous';
import logo from '../assets/logo.jpg';
import { Link } from 'gatsby';

const h1Style = css({
  margin: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const linkStyle = css({
  color: palette.textPrimary,
  textDecoration: 'none',
});
const alignMiddleStyle = css({
  verticalAlign: 'middle',
  display: 'inline-block',
});

const Header = ({ siteTitle }) => (
  <div
    style={{
      background: palette.brandPrimary,
      marginBottom: '1.45rem',
    }}
  >
    <div
      className={h1Style}
      style={{
        margin: '0 auto',
        maxWidth: 960,
        padding: '1.45rem 1.0875rem',
      }}
    >
      <Link to="/" className={linkStyle}>
        <h1
          className={css({
            marginBottom: 0,
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
        </h1>
      </Link>
      <div>
        <Link className={`${linkStyle} ${alignMiddleStyle}`} to="/about-me">
          About
        </Link>
        <a
          className={`${css({
            color: palette.textPrimary,
            marginLeft: 10,
            fontSize: 30,
          })} ${alignMiddleStyle}`}
          href="https://github.com/JasonBoy/blog"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </div>
    </div>
  </div>
);

export default Header;
