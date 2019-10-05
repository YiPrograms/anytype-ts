import { observable, action, computed } from 'mobx';
import { I, Storage } from 'ts/lib';

const COVER = 3;

class CommonStore {
	@observable public popupList: I.PopupInterface[] = [];
	@observable public menuList: I.MenuInterface[] = [];
	@observable public coverId: number = 0;
	
	@computed
	get cover(): number {
		return this.coverId || Storage.get('cover') || COVER;
	};
	
	@computed
	get popups(): I.PopupInterface[] {
		return this.popupList;
	};
	
	@computed
	get menus(): I.MenuInterface[] {
		return this.menuList;
	};
	
	@action
	coverSet (v: number) {
		this.coverId = v;
		Storage.set('cover', v);
	};
	
	@action
	popupOpen (id: string, param: I.PopupParam) {
		this.popupClose(id);
		this.popupList.push({ id: id, param: param });
	};
	
	popupIsOpen (id: string): boolean {
		return this.popupList.find((item: I.PopupInterface) => { return item.id == id; }) ? true : false;
	};
	
	@action
	popupClose (id: string) {
		const item: I.PopupInterface = this.popupList.find((item: I.PopupInterface) => { return item.id == id; });
		
		if (item && item.param.onClose) {
			item.param.onClose();
		};
		
		this.popupList = this.popupList.filter((item: I.PopupInterface) => { return item.id != id; });
	};
	
	@action
	popupCloseAll () {
		for (let item of this.popupList) {
			this.popupClose(item.id);
		};
	};
	
	@action
	menuOpen (id: string, param: I.MenuParam) {
		param.element = String(param.element || '');
		param.offsetX = Number(param.offsetX) || 0;
		param.offsetY = Number(param.offsetY) || 0;
		
		if (!param.element) {
			throw 'Element is not defined';
		};
		
		this.menuClose(id);
		this.menuList.push({ id: id, param: param });
	};
	
	menuIsOpen (id: string): boolean {
		return this.menuList.find((item: I.MenuInterface) => { return item.id == id; }) ? true : false;
	};
	
	@action
	menuClose (id: string) {
		const item: I.MenuInterface = this.menuList.find((item: I.MenuInterface) => { return item.id == id; });
		
		if (item && item.param.onClose) {
			item.param.onClose();
		};
		
		this.menuList = this.menuList.filter((item: I.MenuInterface) => { return item.id != id; });
	};
	
	@action
	menuCloseAll () {
		for (let item of this.menuList) {
			this.menuClose(item.id);
		};
	};
	
};

export let commonStore: CommonStore = new CommonStore();