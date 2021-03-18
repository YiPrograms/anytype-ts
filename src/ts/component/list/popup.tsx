import * as React from 'react';
import { Popup } from 'ts/component';
import { popupStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';

interface Props extends RouteComponentProps<any> {};

const $ = require('jquery');

@observer
class ListPopup extends React.Component<Props, {}> {

	render () {
		const { list } = popupStore;
		
		return (
			<div className="popups">
				{list.map((item: I.Popup, i: number) => (
					<Popup {...this.props} key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidUpdate () {
		const { list } = popupStore;
		const body = $('body');
		
		list.length > 0 ? body.addClass('over') : body.removeClass('over');
	};
	
};

export default ListPopup;