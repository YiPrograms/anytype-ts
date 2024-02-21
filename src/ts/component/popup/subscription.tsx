import * as React from 'react';
import { Title, Icon, Label } from 'Component';
import { I, C, translate, UtilCommon, Storage } from 'Lib';
import { observer } from 'mobx-react';
import PageFree from './page/subscription/free';
import PagePaid from './page/subscription/paid';
import PageCurrent from './page/subscription/current';
import PageSuccess from './page/subscription/success';
import { popupStore } from 'Store';

const PopupSubscriptionPlan = observer(class PopupSubscriptionPlan extends React.Component<I.Popup> {

	currentTier: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onChangeEmail = this.onChangeEmail.bind(this);
		this.setSuccess = this.setSuccess.bind(this);
	};

	render() {
		const { param } = this.props;
		const { data } = param;
		const { tier, success } = data;
		const tierContent = this.getTierContent(tier);
		const tiers = {
			1: { id: I.SubscriptionTier.Explorer },
			2: { id: I.SubscriptionTier.Builder1WeekTEST, price: 99, period: 1, minNameLength: 7 },
			3: { id: I.SubscriptionTier.CoCreator1WeekTEST, price: 399, period: 5, minNameLength: 5 },
		};
		const cn = [ 'sides', `tier${tier}` ];

		let content: any = null;

		if (success) {
			cn.push('success');
			content = <PageSuccess tier={tiers[tier]} />;
		} else
		if (this.currentTier && (this.currentTier.tier == tier)) {
			content = <PageCurrent current={this.currentTier} onChangeEmail={this.onChangeEmail} />;
		} else
		if (tier == 1) {
			content = <PageFree tier={tiers[tier]} setSuccess={this.setSuccess} />;
		} else {
			content = <PagePaid tier={tiers[tier]} />;
		};

		return (
			<div className={cn.join(' ')}>
				<div className="side left">
					<Icon />
					<Title text={translate(`popupSettingsMembershipTitle${tier}`)} />
					<Label text={translate(`popupSettingsMembershipDescription${tier}`)} />

					<div className="contentList">
						<Label text={translate('popupSubscriptionPlanWhatsIncluded')} />
						<ul>
							{tierContent.map((text, idx) => (
								<li key={idx}>{translate(text)}</li>
							))}
						</ul>
					</div>
				</div>

				<div className="side right">{content}</div>
			</div>
		);
	};

	componentDidMount () {
		const subscription = Storage.get('subscription');

		if (subscription.tier) {
			this.currentTier = subscription;
			this.forceUpdate();
		};
	};

	getTierContent (tier) {
		const content = {
			1: [
				'popupSubscriptionPlanTier1Content1',
				'popupSubscriptionPlanTier1Content2',
				'popupSubscriptionPlanTier1Content3',
			],
			2: [
				'popupSubscriptionPlanTier2Content1',
				'popupSubscriptionPlanTier2Content2',
				'popupSubscriptionPlanTier2Content3',
				'popupSubscriptionPlanTier2Content4',
			],
			3: [
				'popupSubscriptionPlanTier3Content1',
				'popupSubscriptionPlanTier3Content2',
				'popupSubscriptionPlanTier3Content3',
				'popupSubscriptionPlanTier3Content4',
				'popupSubscriptionPlanTier3Content5',
			]
		};

		return content[tier];
	};

	onChangeEmail () {
		this.currentTier = null;
		this.forceUpdate();
	};

	setSuccess () {
		const { position } = this.props;
		popupStore.updateData('subscriptionPlan', { success: true });
		position();
	};
});

export default PopupSubscriptionPlan;
