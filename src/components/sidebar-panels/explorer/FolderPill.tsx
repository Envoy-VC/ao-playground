import React from 'react';

import { db } from '~/lib/db';
import { getFileIcon } from '~/lib/helpers/editor';
import { useKeyPress } from '~/lib/hooks';
import { useEditor } from '~/lib/stores';
import { cn } from '~/lib/utils';

import { Button } from '~/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '~/components/ui/context-menu';
import { Input } from '~/components/ui/input';

import { EditorFile, EditorFolder } from '~/types';

import FilePill from './FilePill';

import { ChevronRight, File, Folder } from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';

interface Props extends EditorFolder {
  allFiles: EditorFile[];
  allFolders: EditorFolder[];
}

const FolderPill = ({
  path,
  name,
  allFiles,
  allFolders,
  isCollapsed,
  parentFolder: parent,
}: Props) => {
  const folderPath = path;
  const {
    isCreating,
    name: fileName,
    parentFolder,
    setParentFolder,
    setIsCreating,
    setName: setFileName,
  } = useEditor();

  const folderRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const renameRef = React.useRef<HTMLInputElement>(null);

  const [newName, setNewName] = React.useState(name);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [rerender, setRerender] = React.useState(false);

  const subfolders = allFolders.filter((f) =>
    f.parentFolder.startsWith(folderPath)
  );
  const subFiles = allFiles.filter((f) => f.path.startsWith(folderPath));

  const onRename = async (e: KeyboardEvent) => {
    const newFolderName = newName.trim();
    const oldRootPath = folderPath;
    const newRootPath = parent + newFolderName + '/';

    // rename folder first
    await db.folders.update(folderPath, {
      name: newFolderName,
      path: newRootPath,
    });

    // rename subfolders
    subfolders.forEach(async (f) => {
      const newPath = f.path.replace(oldRootPath, newRootPath);
      const newParent = f.parentFolder.replace(oldRootPath, newRootPath);
      await db.folders.update(f.path, {
        path: newPath,
        parentFolder: newParent,
      });
    });

    // rename sub-files
    subFiles.forEach(async (f) => {
      const newPath = f.path.replace(oldRootPath, newRootPath);
      const newParent = f.parentFolder.replace(oldRootPath, newRootPath);
      await db.files.update(f.path, {
        path: newPath,
        parentFolder: newParent,
      });
    });

    setNewName(name);
    setIsRenaming(false);
  };

  const onDelete = async () => {
    await db.folders.delete(folderPath);
    subfolders.forEach(async (f) => {
      await db.folders.delete(f.path);
    });
    subFiles.forEach(async (f) => {
      await db.files.delete(f.path);
    });
  };

  const onEscape = () => {
    setNewName(name);
    setIsRenaming(false);
    setRerender(false);
  };

  useKeyPress('Enter', onRename, { target: folderRef.current });
  useKeyPress('Escape', onEscape, { target: folderRef.current });
  useOnClickOutside(folderRef, onEscape);

  React.useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, inputRef, parentFolder, isCollapsed]);

  React.useEffect(() => {
    if (isRenaming) {
      setRerender(true);
    }
  }, [isRenaming]);

  React.useEffect(() => {
    if (rerender) {
      renameRef.current?.focus();
    }
  }, [rerender]);

  return (
    <div ref={folderRef}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className='group flex cursor-pointer select-none flex-row items-center justify-between gap-2 px-1'>
            <div className={cn('flex flex-row items-center gap-2')}>
              <Button
                variant='link'
                size='icon'
                className='h-4 w-4'
                onClick={async () => {
                  await db.folders.update(folderPath, {
                    isCollapsed: !isCollapsed,
                  });
                }}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-100 ease-in',
                    isCollapsed ? 'transform' : 'rotate-90'
                  )}
                />
              </Button>
              <Folder className='max-h-4 max-w-4 w-full h-full text-neutral-600 dark:text-neutral-400' />
              <div className={cn(isRenaming ? 'hidden' : 'visible')}>
                {name}
              </div>

              <Input
                ref={renameRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder=''
                className={cn(
                  '!m-0 h-6 rounded-none !p-0 text-base border-none ',
                  isRenaming ? 'visible' : 'invisible'
                )}
              />
            </div>

            <div className='mr-1 flex  flex-row items-center gap-2 opacity-0 transition-all duration-100 ease-in group-hover:opacity-100'>
              <Button
                variant='link'
                size='icon'
                className='h-4 w-4'
                onClick={async () => {
                  if (isCollapsed) {
                    await db.folders.update(folderPath, { isCollapsed: false });
                  }
                  setParentFolder(folderPath);
                  setIsCreating('file');
                }}
              >
                <File className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
              </Button>
              <Button
                variant='link'
                size='icon'
                className='h-4 w-4'
                onClick={async () => {
                  if (isCollapsed) {
                    await db.folders.update(folderPath, { isCollapsed: false });
                  }
                  setParentFolder(folderPath);
                  setIsCreating('folder');
                  inputRef.current?.focus();
                }}
              >
                <Folder className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
              </Button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className='w-64'>
          <ContextMenuItem
            inset
            onClick={async () => {
              if (isCollapsed) {
                await db.folders.update(folderPath, { isCollapsed: false });
              }
              setParentFolder(folderPath);
              setIsCreating('file');
            }}
          >
            New File
          </ContextMenuItem>
          <ContextMenuItem
            inset
            onClick={async () => {
              if (isCollapsed) {
                await db.folders.update(folderPath, { isCollapsed: false });
              }
              setParentFolder(folderPath);
              setIsCreating('folder');
            }}
          >
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            inset
            onClick={() => {
              setIsRenaming(true);
            }}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem inset onClick={async () => await onDelete()}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {!isCollapsed && (
        <div className='ml-[1.5rem]'>
          {subfolders
            .filter((subfolder) => subfolder.parentFolder === folderPath)
            .map((subfolder) => (
              <FolderPill
                key={subfolder.path}
                {...subfolder}
                allFiles={subFiles}
                allFolders={subfolders}
              />
            ))}
          {parentFolder === path && (
            <div className='flex flex-row items-center gap-2 px-1'>
              {isCreating === 'file' && (
                <>
                  {getFileIcon(name) ? (
                    <img src={getFileIcon(name) ?? ''} className='h-4 w-4' />
                  ) : (
                    <File className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
                  )}
                </>
              )}
              {isCreating === 'folder' && (
                <Folder className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
              )}
              <Input
                ref={inputRef}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder=''
                className={cn(
                  'm-0 h-6 rounded-none border-none p-0 text-sm focus-visible:ring-offset-0',
                  isCreating ? 'opacity-100' : 'hidden'
                )}
              />
            </div>
          )}
          {allFiles
            .filter((file) => file.parentFolder === folderPath)
            .map((file) => (
              <FilePill key={file.path} {...file} />
            ))}
        </div>
      )}
    </div>
  );
};

export default FolderPill;
