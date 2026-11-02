import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowLeft, faArrowRight, faArrowUp, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type IconProps = { size?: number; className?: string };

// Font Awesome Free icons; `size` is the icon height in px (FA icons are 1em tall).
const icon = (definition: IconDefinition) =>
  function Icon({ size, className }: IconProps) {
    return (
      <FontAwesomeIcon icon={definition} className={className} style={size ? { fontSize: size } : undefined} />
    );
  };

export const ArrowLeftIcon = icon(faArrowLeft);
export const ArrowRightIcon = icon(faArrowRight);
export const ArrowUpIcon = icon(faArrowUp);
export const CopyIcon = icon(faCopy);
export const GitHubIcon = icon(faGithub);
export const XIcon = icon(faTwitter);
