import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_TYPES = ['.txt', '.pdf', '.docx'];

const FileUploadModal = ({ open, onClose, onUpload }: FileUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_TYPES.includes(extension)) {
      toast({
        title: 'Invalid file type',
        description: `Please upload ${ALLOWED_TYPES.join(', ')} files only.`,
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 200MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a .txt, .pdf, or .docx file (max 200MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleChange}
              className="hidden"
            />
            
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: {ALLOWED_TYPES.join(', ')} • Max size: 200MB
            </p>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="flex-1 bg-gradient-primary"
            >
              Upload & Analyze
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
