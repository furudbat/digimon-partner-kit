import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Footer } from 'flowbite-react';

export function MainFooter() {
  return (
    <Footer container className="footer bottom-0 inset-x-0 rounded-none shadow-none max-h-16 mt-6 lg:mt-8">
      <div className="mx-6 w-full p-4">
        <div className="sm:flex items-center sm:justify-between w-full">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            © 2024{' '}
            <a href="https://github.com/furudbat" target="_blank" rel="noreferrer" className="hover:underline">
              furudbat
            </a>
            .{' '}
            <em>
              This Project is free fan site and not affiliated with Bandai. Digimon and other media relating to the
              franchise are registered trademarks by Bandai. Thanks to{' '}
              <a href="https://wikimon.net/" target="_blank" rel="noreferrer">
                https://wikimon.net/
              </a>
              .
            </em>
          </span>
          <div className="flex mt-4 justify-center sm:mt-0 p-2 mx-2 w-16">
            <a
              className="text-gray-500 dark:text-gray-400 font-medium h-4 m-2"
              target="_blank"
              rel="noreferrer"
              href="https://twitter.com/furudbat"
            >
              <FontAwesomeIcon icon={faTwitter} height={24} />
            </a>
            <a
              className="text-gray-500 dark:text-gray-400 font-medium h-4 m-2"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/furudbat"
            >
              <FontAwesomeIcon icon={faGithub} height={24} />
            </a>
          </div>
        </div>
      </div>
    </Footer>
  );
}
