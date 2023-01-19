import * as React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import $ from 'jquery';
import { Icon, IconObject, Select } from 'Component';
import { I, C, Relation, Util, keyboard, analytics } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT = 48;
const LIMIT = 20;

const MenuSort = observer(class MenuSort extends React.Component<I.Menu> {
	
	node: any = null;
	n = 0;
	top = 0;
	cache: any = {};
	refList: any = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		
		if (!view) {
			return null;
		};

		const items = this.getItems();
		const sortCnt = items.length;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
		
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'Ascending' },
			{ id: String(I.SortType.Desc), name: 'Descending' },
		];
		
		const relationOptions = this.getRelationOptions();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => {
			const relation: any = dbStore.getRelationByKey(item.relationKey) || {};
			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (!allowedView ? 'isReadonly' : '') ].join(' ')}
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
					style={item.style}
				>
					{allowedView ? <Handle /> : ''}
					<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />
					<div className="txt">
						<Select id={[ 'filter', 'relation', item.id ].join('-')} options={relationOptions} value={item.relationKey} onChange={(v: string) => { this.onChange(item.id, 'relationKey', v); }} />
						<Select id={[ 'filter', 'type', item.id ].join('-')} className="grey" options={typeOptions} value={item.type} onChange={(v: string) => { this.onChange(item.id, 'type', v); }} />
					</div>
					{allowedView ? (
						<div className="buttons">
							<Icon className="more" onClick={(e: any) => { this.onClick(e, item); }} />
							<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
						</div>
					) : ''}
				</div>
			);
		});

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{!items.length ? (
						<div className="item empty">
							<div className="inner">No sorts applied to this view</div>
						</div>
					) : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => true}
							threshold={LIMIT}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<VList
											ref={(ref: any) => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											onScroll={this.onScroll}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>
			);
		});
		
		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<List 
					axis="y"
					lockAxis="y"
					lockToContainerEdges={true}
					transitionDuration={150}
					distance={10}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => { return $(this.node).find('.items').get(0); }}
				/>
				{allowedView ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd}
							onMouseEnter={() => { this.props.setHover({ id: 'add' }); }} 
							onMouseLeave={() => { this.props.setHover(); }}
						>
							<Icon className="plus" />
							<div className="name">New sort</div>
						</div> 
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount() {
		const items = this.getItems();

		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});
	};
	
	componentDidUpdate () {
		this.resize();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		if (!view) {
			return [];
		};
		
		let n = 0;
		return Util.objectCopy(view.sorts || []).map((it: any) => {
			it.id = n++;
			return it;
		});
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				options: this.getRelationOptions(),
				value: item.relationKey,
				itemId: item.id,
				onSelect: (e: any, el: any) => {
					this.onChange(item.id, 'relationKey', el.id);
				}
			}
		});
	};

	onAdd () {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, getView, blockId, getData } = data;
		const view = getView();
		const relationOptions = this.getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const newItem = { 
			relationKey: relationOptions[0].id, 
			type: I.SortType.Asc,
		};

		C.BlockDataviewSortAdd(rootId, blockId, view.id, newItem, () => {
			getData(view.id, 0, true);

			content.animate({ scrollTop: content.get(0).scrollHeight }, 50);
			analytics.event('AddSort', { type: newItem.type });
		});
	};

	onChange (id: number, k: string, v: string) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, getData } = data;
		const view = getView();
		const item = view.getSort(id);

		item[k] = v;

		C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, item.relationKey, { ...item }, () => {
			getData(view.id, 0, true);
		});

		analytics.event('ChangeSortValue', { type: item.type });
		this.forceUpdate();
	};
	
	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, getData } = data;
		const view = getView();

		C.BlockDataviewSortRemove(rootId, blockId, view.id, [ item.relationKey ], () => {
			getData(view.id, 0, true);
		});

		menuStore.close('select');
		analytics.event('RemoveSort');
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex,  } = result;
		const { param, dataset } = this.props;
		const { selection } = dataset;
		const { data } = param;
		const { rootId, blockId, getView, getData } = data;
		const view = getView();

		view.sorts = arrayMove(view.sorts, oldIndex, newIndex);
		C.BlockDataviewViewRelationRemove(rootId, blockId, view.id, view.sorts.map(it => it.id), () => {
			getData(view.id, 0, true);
		});

		selection.preventSelect(false);
		analytics.event('RepositionSort');
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 62;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};
	
});

export default MenuSort;