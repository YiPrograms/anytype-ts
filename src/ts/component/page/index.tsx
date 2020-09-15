import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Util, Storage, analytics, keyboard } from 'ts/lib';
import { commonStore } from 'ts/store';

import PageAuthInvite from './auth/invite';
import PageAuthNotice from './auth/notice';
import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinSelect from './auth/pin/select';
import PageAuthPinConfirm from './auth/pin/confirm';
import PageAuthPinCheck from './auth/pin/check';
import PageAuthSetup from './auth/setup';
import PageAuthAccountSelect from './auth/account/select';
import PageAuthRegister from './auth/register';
import PageAuthSuccess from './auth/success';

import PageMainIndex from './main/index';
import PageMainEdit from './main/edit';
import PageMainHistory from './main/history';
import PageMainSet from './main/set';

const $ = require('jquery');
const raf = require('raf');
const Components: any = {
	'/':					 PageAuthSelect,
	'auth/invite':			 PageAuthInvite,
	'auth/select':			 PageAuthSelect,
	'auth/register':		 PageAuthRegister,
	'auth/login':			 PageAuthLogin,
	'auth/pin-select':		 PageAuthPinSelect,
	'auth/pin-confirm':		 PageAuthPinConfirm,
	'auth/pin-check':		 PageAuthPinCheck,
	'auth/setup':			 PageAuthSetup,
	'auth/account-select':	 PageAuthAccountSelect,
	'auth/success':			 PageAuthSuccess,
			
	'main/index':			 PageMainIndex,
	'main/edit':			 PageMainEdit,
	'main/history':			 PageMainHistory,
	'main/set':				 PageMainSet,
};

interface Props extends RouteComponentProps<any> {};

class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	childRef: any;

	render () {
		const { match } = this.props;
		const path = [ match.params.page, match.params.action ].join('/');
		const showNotice = !Boolean(Storage.get('firstRun'));
		const pin = Storage.get('pin');
		
		if (showNotice) {
			Components['/'] = PageAuthNotice;
			Storage.set('firstRun', 1);
		};

		const Component = Components[path];
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};
		
		return (
			<div className={this.getClass('page')}>
				<Component ref={(ref: any) => this.childRef = ref} {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	init () {
		const { match } = this.props;
		const popupNewBlock = Storage.get('popupNewBlock');
		const isIndex = !match.params.page;
		const isAuth = match.params.page == 'auth';
		const isMain = match.params.page == 'main';
		const isCheck = isAuth && (match.params.action == 'pin-check');
		const pin = Storage.get('pin');

		if (pin && !keyboard.isPinChecked && !isCheck && !isAuth && !isIndex) {
			this.props.history.push('/auth/pin-check');
			return;
		};

		this.setBodyClass();
		this.resize();
		this.event();
		this.unbind();
		
		commonStore.popupCloseAll();
		commonStore.menuCloseAll();
		Util.linkPreviewHide(true);
		
		keyboard.setMatch(match);

		if (!popupNewBlock && isMain) {
			commonStore.popupOpen('help', { 
				data: { document: 'whatsNew' },
			});
		};

		$(window).on('resize.page', () => { this.resize(); });
	};
	
	unbind () {
		$(window).unbind('resize.page');
	};
	
	event () {
		const { match } = this.props;
		const page = String(match.params.page || 'index');
		const action = String(match.params.action || 'index');
		const path = [ 'page', page, action ].join('-');
		
		analytics.event(Util.toUpperCamelCase(path));
	};
	
	getClass (prefix: string) {
		const { match } = this.props;
		const page = match.params.page || 'index';
		const action = match.params.action || 'index';
		const platform = Util.getPlatform();

		return [ 
			Util.toCamelCase([ prefix, page ].join('-')),
			Util.toCamelCase([ prefix, page, action ].join('-')),
			Util.toCamelCase([ 'platform', platform ].join('-')),
		].join(' ');
	};
	
	setBodyClass () {
		$('body').attr({ class: this.getClass('body') });
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.childRef && this.childRef.resize) {
				this.childRef.resize();			
			};			
		});
	};
	
};

export default Page;