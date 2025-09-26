import { MobileQuestionViewer } from './MobileQuestionViewer';

interface QuestionViewerProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionViewer({ exam, isOpen, onClose }: QuestionViewerProps) {
  // Use the enhanced mobile-responsive viewer for all devices
  return <MobileQuestionViewer exam={exam} isOpen={isOpen} onClose={onClose} />;
}
