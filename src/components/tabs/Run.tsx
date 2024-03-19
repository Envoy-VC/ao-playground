import React from 'react';

import { Button } from '../ui/button';
import { Play, LoaderCircle } from 'lucide-react';

import { useReadLocalStorage } from 'usehooks-ts';
import { db } from '~/lib/db';

import { parse } from 'luaparse';
import { getRequireValuesFromAST, RequireFile } from '~/lib/helpers/ast-parser';

import { useEditor } from '~/lib/stores';

import { Process } from '~/lib/db';
import { toast } from 'sonner';
import { sendMessage } from '~/lib/services/message';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

const Run = () => {
  const { activePath } = useEditor();
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const activeProcess = useReadLocalStorage<Process | undefined>(
    'activeProcess'
  );

  const [requiredFiles, setRequiredFiles] = React.useState<RequireFile[]>([]);

  const checks = async () => {
    if (!activeProcess) {
      throw new Error('No active process found');
    }
    const data = await db.files.get(activePath ?? '');
    if (!data) {
      throw new Error('File not found');
    }
    if (data.content === '') {
      throw new Error('File is empty');
    }
    if (!activePath) {
      throw new Error('No active file found');
    }
    return data;
  };

  const send = async () => {
    try {
      const data = await checks();
      setIsSending(true);
      const ast = parse(data.content);
      const requiredFiles = await getRequireValuesFromAST(ast);
      requiredFiles.push({
        filePath: activePath!,
        content: data.content,
        exists: true,
      });
      setRequiredFiles(requiredFiles);

      if (requiredFiles.length === 0) {
        throw new Error('No required files found');
      } else if (requiredFiles.length === 1) {
        sendMessage({
          process: activeProcess!.id,
          data: requiredFiles[0].content,
        });
        toast.success('Messages Sent');
      } else {
        // TODO: Handle for multiple files
        setIsModalOpen(true);
        // // const ids = await Promise.all(
        // //   files.reverse().map(async (path) => {
        // //     const fileData = await db.files.get(path);
        // //     if (!fileData) {
        // //       throw new Error('File not found');
        // //     }
        // //     if (fileData.content === '') {
        // //       throw new Error('File is empty');
        // //     }
        // //     const id = await sendMessage({
        // //       process: activeProcess.id,
        // //       data: fileData.content,
        // //     });
        // //     return id;
        // //   })
        // // );
      }
    } catch (error) {
      toast.error('', { description: (error as Error).message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <Button
        size='sm'
        variant='ghost'
        className='gap-2'
        onClick={send}
        disabled={isSending}
      >
        {isSending ? (
          <LoaderCircle size={18} className='animate-spin' />
        ) : (
          <Play size={18} />
        )}
        Run
      </Button>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Imported files found. Do you want to send them as well?
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-row justify-between gap-2'>
            <div className='flex flex-col gap-4'>
              <div className='text-base font-medium'>Resolved Files</div>
              <div>
                {requiredFiles
                  .filter((f) => f.exists)
                  .map((file) => (
                    <div
                      className='text-base font-medium text-neutral-500'
                      key={file.filePath}
                    >
                      {file.filePath.slice(1)}
                    </div>
                  ))}
              </div>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='text-base font-medium'>
                Files that could not be resolved
              </div>
              <div>
                {requiredFiles
                  .filter((f) => !f.exists)
                  .map((file) => (
                    <div
                      className='text-base font-medium text-red-500'
                      key={file.filePath}
                    >
                      {file.filePath.slice(1)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Run;
