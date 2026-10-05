import React from 'react';
import { TableCardItem } from '../../types';
import { getItemColorClasses } from '../../utils/theme';
import { Plus, Trash2, Table as TableIcon } from 'lucide-react';

interface TableCardProps {
  item: TableCardItem;
  onUpdate: (updates: Partial<TableCardItem>) => void;
  onDelete: () => void;
  isSelected?: boolean;
}

export const TableCard: React.FC<TableCardProps> = ({ item, onUpdate, onDelete, isSelected }) => {
  const colorClasses = getItemColorClasses(item.color);
  const table = item.table;

  const handleCellChange = (rowId: string, colId: string, val: string | boolean | number) => {
    const newRows = table.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [colId]: val,
          },
        };
      }
      return row;
    });
    onUpdate({ table: { ...table, rows: newRows } });
  };

  const handleAddRow = () => {
    const newRow = {
      id: 'r-' + Date.now(),
      cells: {},
    };
    onUpdate({ table: { ...table, rows: [...table.rows, newRow] } });
  };

  const handleDeleteRow = (rowId: string) => {
    const newRows = table.rows.filter((r) => r.id !== rowId);
    onUpdate({ table: { ...table, rows: newRows } });
  };

  // Calculate totals for currency and number columns
  const costCol = table.columns.find((c) => c.type === 'currency' || c.name.toLowerCase().includes('cost'));
  const hoursCol = table.columns.find((c) => c.type === 'number' || c.name.toLowerCase().includes('hour'));

  const totalCost = costCol
    ? table.rows.reduce((acc, r) => acc + (Number(r.cells[costCol.id]) || 0), 0)
    : 0;

  const totalHours = hoursCol
    ? table.rows.reduce((acc, r) => acc + (Number(r.cells[hoursCol.id]) || 0), 0)
    : 0;

  return (
    <div
      id={`item-${item.id}`}
      className={`group rounded-md border p-3 bg-white transition-all shadow-xs ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TableIcon className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            type="text"
            value={table.title}
            onChange={(e) => onUpdate({ table: { ...table, title: e.target.value } })}
            placeholder="Table title..."
            className="font-serif font-bold text-sm text-neutral-900 tracking-tight bg-transparent outline-none w-full"
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
          title="Delete table"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-800 text-white rounded-t">
              {table.columns.map((col) => (
                <th key={col.id} className="py-1.5 px-2 font-medium text-[11px] first:rounded-tl last:rounded-tr">
                  {col.name}
                </th>
              ))}
              <th className="w-6 py-1.5 px-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {table.rows.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50 group/tr">
                {table.columns.map((col) => (
                  <td key={col.id} className="py-1 px-1.5 text-neutral-900">
                    {col.type === 'checkbox' ? (
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row.cells[col.id])}
                          onChange={(e) => handleCellChange(row.id, col.id, e.target.checked)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-400 w-3.5 h-3.5"
                        />
                      </div>
                    ) : col.type === 'currency' ? (
                      <div className="flex items-center gap-0.5 text-neutral-900">
                        <span className="text-neutral-500 text-[11px]">$</span>
                        <input
                          type="number"
                          value={typeof row.cells[col.id] === 'number' ? (row.cells[col.id] as number) : ''}
                          onChange={(e) => handleCellChange(row.id, col.id, Number(e.target.value))}
                          placeholder="0.00"
                          className="w-16 bg-transparent outline-none text-xs font-mono text-right text-neutral-900"
                        />
                      </div>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={
                          typeof row.cells[col.id] === 'string' || typeof row.cells[col.id] === 'number'
                            ? (row.cells[col.id] as string | number)
                            : ''
                        }
                        onChange={(e) =>
                          handleCellChange(row.id, col.id, col.type === 'number' ? Number(e.target.value) : e.target.value)
                        }
                        placeholder="..."
                        className="w-full bg-transparent outline-none text-xs text-neutral-900 placeholder:text-neutral-400"
                      />
                    )}
                  </td>
                ))}
                <td className="py-1 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-neutral-300 hover:text-red-500 opacity-0 group-hover/tr:opacity-100"
                    title="Delete row"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 font-semibold bg-neutral-50 text-[11px]">
              <td className="py-1.5 px-2">Total</td>
              {hoursCol && <td className="py-1.5 px-2 font-mono">{totalHours} hrs</td>}
              {costCol && <td className="py-1.5 px-2 font-mono">${totalCost.toFixed(2)}</td>}
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddRow}
          className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 font-medium hover:underline"
        >
          <Plus className="w-3 h-3" /> Add row
        </button>
      </div>
    </div>
  );
};
