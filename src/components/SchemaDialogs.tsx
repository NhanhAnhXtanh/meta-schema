import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AddTableDialog } from './AddTableDialog';
import { LinkFieldDialog } from './LinkFieldDialog';

export function SchemaDialogs() {
    const linkFieldDialogIsOpen = useSelector((state: RootState) => state.ui.linkFieldDialog.isOpen);

    return (
        <>
            <AddTableDialog />
            {linkFieldDialogIsOpen && <LinkFieldDialog />}
        </>
    );
}
