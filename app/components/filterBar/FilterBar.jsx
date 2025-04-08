'use client';
import React, { useMemo, useCallback } from 'react';
import { useSearch } from '../../context/OptimizedSearchContext';
import { useColor } from '../../context/ColorContext';
import ColorSelector from './ColorSelector';
import SortPeople from './SortPeople';
import SortOrientation from './SortOrientation';
import SortGlobal from './Sortglobal';

export default function FilterBar() { 
    const {
        selectedPeople,
        setSelectedPeople,
        selectedSort,
        setSelectedSort,
        selectedOrientation,
        setSelectedOrientation,
    } = useSearch();
    const { setSelectedColor } = useColor();
    const colorSelectorMemo = useMemo(() => <ColorSelector />, []);
    const sortPeopleMemo = useMemo(() => (
        <SortPeople selectedPeople={selectedPeople} onPeopleChange={setSelectedPeople} />
    ), [selectedPeople, setSelectedPeople]);
    const sortOrientationMemo = useMemo(() => (
        <SortOrientation selectedOrientation={selectedOrientation} onOrientationChange={setSelectedOrientation} />
    ), [selectedOrientation, setSelectedOrientation]);
    const sortGlobalMemo = useMemo(() => (
        <SortGlobal selectedSort={selectedSort} onSortChange={setSelectedSort} />
    ), [selectedSort, setSelectedSort]);

    const handleClearFilters = useCallback(() => {
        setSelectedPeople('all');
        setSelectedColor('');
        setSelectedOrientation('all');
        setSelectedSort('relevance');
    }, [setSelectedPeople, setSelectedColor, setSelectedOrientation, setSelectedSort]);

    return (
        <div className="sticky top-[50px] bg-transparent z-40 py-2 sm:block">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {colorSelectorMemo}
                    {sortPeopleMemo}
                    {sortOrientationMemo}
                    {sortGlobalMemo}
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}