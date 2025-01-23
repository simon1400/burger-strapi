import type { Schema, Attribute } from '@strapi/strapi';

export interface ContactContact extends Schema.Component {
  collectionName: 'components_contact_contacts';
  info: {
    displayName: 'contact';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    function: Attribute.String & Attribute.Required;
    email: Attribute.Email & Attribute.Required;
    image: Attribute.Media;
    phone: Attribute.String;
  };
}

export interface ContentAdditionalLabelEvent extends Schema.Component {
  collectionName: 'components_content_additional_label_events';
  info: {
    displayName: 'Additional label event';
  };
  attributes: {
    icon: Attribute.Media & Attribute.Required;
    text: Attribute.String & Attribute.Required;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentGalery extends Schema.Component {
  collectionName: 'components_content_galeries';
  info: {
    displayName: 'galery';
  };
  attributes: {
    image: Attribute.Media;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentLink extends Schema.Component {
  collectionName: 'components_content_links';
  info: {
    displayName: 'link';
  };
  attributes: {
    text: Attribute.String & Attribute.Required;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentNavItemChild extends Schema.Component {
  collectionName: 'components_content_nav_item_children';
  info: {
    displayName: 'navItemChild';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentNavItem extends Schema.Component {
  collectionName: 'components_content_nav_items';
  info: {
    displayName: 'navItem';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    link: Attribute.String & Attribute.Required;
    child: Attribute.Component<'content.nav-item-child', true>;
  };
}

export interface ContentPartner extends Schema.Component {
  collectionName: 'components_content_partners';
  info: {
    displayName: 'Partner';
  };
  attributes: {
    image: Attribute.Media & Attribute.Required;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentPointMap extends Schema.Component {
  collectionName: 'components_content_point_maps';
  info: {
    displayName: 'pointMap';
    description: '';
  };
  attributes: {
    idLayer: Attribute.String & Attribute.Required;
    festival: Attribute.Relation<
      'content.point-map',
      'oneToOne',
      'api::festival.festival'
    >;
  };
}

export interface ContentWinners extends Schema.Component {
  collectionName: 'components_content_winners';
  info: {
    displayName: 'winners';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    number: Attribute.String;
  };
}

export interface FormCodes extends Schema.Component {
  collectionName: 'components_form_codes';
  info: {
    displayName: 'codes';
    icon: 'apps';
  };
  attributes: {
    code: Attribute.String;
  };
}

export interface FormRadio extends Schema.Component {
  collectionName: 'components_form_radios';
  info: {
    displayName: 'radio';
    description: '';
  };
  attributes: {
    item: Attribute.Component<'form.select-item', true>;
    label: Attribute.String;
    errorMessage: Attribute.String;
    required: Attribute.Boolean;
  };
}

export interface FormResultItem extends Schema.Component {
  collectionName: 'components_form_result_items';
  info: {
    displayName: 'ResultItem';
  };
  attributes: {
    key: Attribute.String;
    value: Attribute.String;
  };
}

export interface FormSelectItem extends Schema.Component {
  collectionName: 'components_form_select_items';
  info: {
    displayName: 'selectItem';
  };
  attributes: {
    label: Attribute.String;
    disabled: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface FormSelect extends Schema.Component {
  collectionName: 'components_form_selects';
  info: {
    displayName: 'select';
    description: '';
  };
  attributes: {
    item: Attribute.Component<'form.select-item', true>;
    required: Attribute.Boolean;
    errorMessage: Attribute.String;
    label: Attribute.String;
  };
}

export interface FormTetxField extends Schema.Component {
  collectionName: 'components_form_tetx_fields';
  info: {
    displayName: 'tetxField';
    description: '';
  };
  attributes: {
    label: Attribute.String;
    helperText: Attribute.String;
    errorMessage: Attribute.String;
    placeholder: Attribute.String;
    required: Attribute.Boolean & Attribute.DefaultTo<true>;
  };
}

export interface FormUploud extends Schema.Component {
  collectionName: 'components_form_uplouds';
  info: {
    displayName: 'uploud';
    description: '';
  };
  attributes: {
    label: Attribute.String;
  };
}

export interface SeoMeta extends Schema.Component {
  collectionName: 'components_seo_metas';
  info: {
    displayName: 'meta';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    image: Attribute.Media;
    description: Attribute.RichText;
  };
}

export interface SocialSocial extends Schema.Component {
  collectionName: 'components_social_socials';
  info: {
    displayName: 'social';
    description: '';
  };
  attributes: {
    type: Attribute.Enumeration<['facebook', 'instagram', 'twitter']> &
      Attribute.Required &
      Attribute.DefaultTo<'facebook'>;
    link: Attribute.String & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'contact.contact': ContactContact;
      'content.additional-label-event': ContentAdditionalLabelEvent;
      'content.galery': ContentGalery;
      'content.link': ContentLink;
      'content.nav-item-child': ContentNavItemChild;
      'content.nav-item': ContentNavItem;
      'content.partner': ContentPartner;
      'content.point-map': ContentPointMap;
      'content.winners': ContentWinners;
      'form.codes': FormCodes;
      'form.radio': FormRadio;
      'form.result-item': FormResultItem;
      'form.select-item': FormSelectItem;
      'form.select': FormSelect;
      'form.tetx-field': FormTetxField;
      'form.uploud': FormUploud;
      'seo.meta': SeoMeta;
      'social.social': SocialSocial;
    }
  }
}
