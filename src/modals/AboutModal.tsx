import BaseModal from './BaseModal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="About Uni Tracker"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">The Story</h3>
          <p className="text-base text-[var(--text-secondary)]">
            Uni Tracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
          </p>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">About Me</h3>
          <p className="text-base text-[var(--text-secondary)]">
            Hi! I'm Ricky, the creator of Uni Tracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
          </p>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Get in Touch</h3>
          <p className="text-base text-[var(--text-secondary)] mb-2">
            I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
          </p>
            <a 
            href="mailto:info@unitracker.me" 
            className="flex items-center gap-2 text-[var(--accent-primary)] text-base font-medium hover:underline"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.797l-7.5 5.625a2.25 2.25 0 01-2.748 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
            </svg>
              info@unitracker.me
            </a>
        </div>
        
        <div className="border-t border-[var(--border-primary)] pt-4 text-center text-[var(--text-secondary)] pb-2">
            Thank you for using Uni Tracker! Your support and feedback help make this app better!
        </div>
      </div>
    </BaseModal>
  );
};

export default AboutModal; 