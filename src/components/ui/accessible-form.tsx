import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/use-accessibility';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  showLabel?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, description, error, required, showLabel = true, className, ...props }, ref) => {
    const inputId = useId();
    const descriptionId = useId();
    const errorId = useId();
    const { preferences, getAriaProps } = useAccessibility();

    return (
      <div className="space-y-2">
        {showLabel && (
          <label 
            htmlFor={inputId}
            className={`block text-sm font-medium text-fg-primary ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}
          >
            {label}
          </label>
        )}
        
        {description && (
          <p id={descriptionId} className="text-sm text-fg-secondary">
            {description}
          </p>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            "focus-gradient-ring transition-all",
            preferences.reducedMotion ? '' : 'duration-normal',
            error ? 'border-red-500 focus:border-red-500' : '',
            className
          )}
          aria-describedby={cn(
            description ? descriptionId : undefined,
            error ? errorId : undefined
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p 
            id={errorId} 
            className="text-sm text-red-500"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    loadingText = 'Loading...', 
    children, 
    className, 
    disabled,
    ...props 
  }, ref) => {
    const { preferences, handleKeyboardNavigation } = useAccessibility();

    const baseClasses = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-all focus-gradient-ring touch-target",
      preferences.reducedMotion ? '' : 'duration-normal ease-out-quart',
      disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    );

    const variantClasses = {
      primary: 'bg-gradient-primary text-bg-primary hover:shadow-glow-md hover:scale-105',
      secondary: 'bg-bg-secondary border border-accent-primary/20 text-fg-primary hover:bg-bg-secondary/70 hover:border-accent-primary/40',
      ghost: 'text-fg-primary hover:bg-bg-secondary/50',
      destructive: 'bg-red-600 text-white hover:bg-red-700'
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-describedby={loading ? 'loading-description' : undefined}
        onKeyDown={(e) => handleKeyboardNavigation(e, {
          onEnter: () => !disabled && !loading && props.onClick?.(e as any),
          onSpace: () => !disabled && !loading && props.onClick?.(e as any)
        })}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            {loadingText}
            <span id="loading-description" className="sr-only">
              Button is loading, please wait
            </span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

interface AccessibleFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label: string;
  description?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export const AccessibleFileUpload = forwardRef<HTMLInputElement, AccessibleFileUploadProps>(
  ({ onFileSelect, accept, label, description, disabled, multiple, ...props }, ref) => {
    const inputId = useId();
    const descriptionId = useId();
    const { preferences, announce, handleKeyboardNavigation, getAriaProps } = useAccessibility();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        onFileSelect(file);
        announce(`Selected file: ${file.name}`, 'polite');
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        onFileSelect(file);
        announce(`Dropped file: ${file.name}`, 'polite');
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-fg-primary"
        >
          {label}
        </label>
        
        {description && (
          <p id={descriptionId} className="text-sm text-fg-secondary">
            {description}
          </p>
        )}
        
        <div
          className={cn(
            "relative border-2 border-dashed border-accent-primary/30 rounded-lg p-6 text-center transition-all",
            preferences.reducedMotion ? '' : 'duration-normal ease-out-quart',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-primary/50 hover:bg-bg-secondary/30',
            "focus-within:border-accent-primary focus-within:bg-bg-secondary/30"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onKeyDown={(e) => handleKeyboardNavigation(e, {
            onEnter: () => !disabled && document.getElementById(inputId)?.click(),
            onSpace: () => !disabled && document.getElementById(inputId)?.click()
          })}
          tabIndex={disabled ? -1 : 0}
          role="button"
          {...getAriaProps('button', { 
            label: `${label}. Click or drag and drop to select file`,
            describedBy: description ? descriptionId : undefined
          })}
        >
          <input
            ref={ref}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-describedby={description ? descriptionId : undefined}
            {...props}
          />
          
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-bg-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-fg-primary font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-fg-secondary text-sm">
                {accept ? `Supported formats: ${accept}` : 'Any file type'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AccessibleFileUpload.displayName = 'AccessibleFileUpload';

interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  variant?: 'default' | 'gradient';
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'default'
}) => {
  const progressId = useId();
  const percentage = Math.round((value / max) * 100);
  const { preferences } = useAccessibility();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={progressId} className="text-sm font-medium text-fg-primary">
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-fg-secondary" aria-live="polite">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
      >
        <div
          className={cn(
            "h-full transition-all",
            preferences.reducedMotion ? '' : 'duration-normal ease-out-quart',
            variant === 'gradient' ? 'bg-gradient-primary' : 'bg-accent-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <span className="sr-only" aria-live="polite">
        {label} progress: {percentage}% complete
      </span>
    </div>
  );
};