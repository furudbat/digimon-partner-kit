import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Footer } from 'flowbite-react';

export function MainFooter() {
  return (
    <Footer container className="footer bottom-0 inset-x-0 rounded-none shadow-none max-h-16 mt-6 lg:mt-8">
      <div className="mx-auto w-full max-w-screen-xl p-4">
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2024{' '}
            <a href="https://flowbite.com/" className="hover:underline">
              furudbat
            </a>
            .{' '}
            <em>
              This Project is free fan site and not affiliated with Bandai. Digimon and other media relating to the
              franchise are registered trademarks by Bandai.
            </em>
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0">
            <a href="https://twitter.com/furudbat">
              <FontAwesomeIcon icon={faTwitter} />
              <span className="sr-only">Twitter page</span>
            </a>
            <a href="https://github.com/furudbat">
              <FontAwesomeIcon icon={faGithub} />
              <span className="sr-only">GitHub account</span>
            </a>
          </div>
        </div>
      </div>
    </Footer>
  );
}
