import React from 'react';
import g from 'glamorous';
import { css } from 'glamor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

import palette from '../utils/palette';
import gatsbyLogo from '../assets/icons/gatsby.svg';
import netlifyLogo from '../assets/icons/netlify.png';

const UL = g.ul({
  display: 'inline-block',
  listStyle: 'none',
  marginBottom: 0,
});

const LI = g.li({
  display: 'inline-block',
  marginRight: 5,
  position: 'relative',
  paddingRight: 5,
  '&:not(:last-child):after': {
    content: '""',
    position: 'absolute',
    display: 'inline-block',
    width: 1,
    height: '50%',
    background: '#484747',
    top: '50%',
    right: 0,
    transform: 'translateY(-50%)',
  },
});

const alignMiddleStyle = css({
  color: '#ada7a7',
  fontWeight: 'lighter',
  '& > span, & > i, & > img': {
    display: 'inline-block',
    verticalAlign: 'middle',
  },
});

const year = new Date().getFullYear();

const Footer = ({ siteTitle }) => (
  <g.Footer
    textAlign="center"
    padding={15}
    fontSize="0.75rem"
    color={palette.textPrimary}
    backgroundColor={palette.brandPrimary}
  >
    <div>
      <UL>
        <LI>
          <g.A
            target="_blank"
            title="Gatsby.js"
            className={alignMiddleStyle}
            href="https://www.gatsbyjs.org/"
          >
            <g.Span marginRight={4}>Powered By</g.Span>
            <g.Img src={gatsbyLogo} width="16" height="16" />
          </g.A>
        </LI>
        <LI>
          <g.A
            target="_blank"
            title="Netlify.com"
            className={alignMiddleStyle}
            href="https://www.netlify.com/"
          >
            <g.Span marginRight={4}>Deployed On</g.Span>
            <g.Img src={netlifyLogo} width="16" height="16" />
          </g.A>
        </LI>
        <LI>
          <g.A
            target="_blank"
            className={alignMiddleStyle}
            href="https://github.com/JasonBoy"
          >
            <g.Span marginRight={4}>
              With{' '}
              <span role="img" aria-label="love">
                💖
              </span>{' '}
              By
            </g.Span>
            <FontAwesomeIcon icon={faGithub} size="lg" />
          </g.A>
        </LI>
      </UL>
    </div>
    <g.Div textAlign="center">
      {siteTitle} @ {year}
    </g.Div>
  </g.Footer>
);

export default Footer;
