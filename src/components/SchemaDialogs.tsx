
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LinkFieldDialog } from './LinkFieldDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

export function SchemaDialogs() {
    const linkFieldDialogIsOpen = useSelector((state: RootState) => state.ui.linkFieldDialog.isOpen);
    const confirmDeleteDialogIsOpen = useSelector((state: RootState) => state.ui.confirmDeleteDialog?.isOpen);

    return (
        <>
            {linkFieldDialogIsOpen && <LinkFieldDialog />}
            {confirmDeleteDialogIsOpen && <ConfirmDeleteDialog />}
        </>
    );
}
