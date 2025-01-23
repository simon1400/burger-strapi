import type { Schema, Attribute } from '@strapi/strapi';

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

export interface SeoMeta extends Schema.Component {
  collectionName: 'components_seo_metas';
  info: {
    displayName: 'meta';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    image: Attribute.Media<'images'>;
    description: Attribute.RichText;
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

export interface ContentPartner extends Schema.Component {
  collectionName: 'components_content_partners';
  info: {
    displayName: 'Partner';
  };
  attributes: {
    image: Attribute.Media<'images'> & Attribute.Required;
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

export interface ContentGalery extends Schema.Component {
  collectionName: 'components_content_galeries';
  info: {
    displayName: 'galery';
  };
  attributes: {
    image: Attribute.Media<'images'>;
    link: Attribute.String & Attribute.Required;
  };
}

export interface ContentAdditionalLabelEvent extends Schema.Component {
  collectionName: 'components_content_additional_label_events';
  info: {
    displayName: 'Additional label event';
  };
  attributes: {
    icon: Attribute.Media<'images'> & Attribute.Required;
    text: Attribute.String & Attribute.Required;
    link: Attribute.String & Attribute.Required;
  };
}

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
    image: Attribute.Media<'images'>;
    phone: Attribute.String;
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

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'social.social': SocialSocial;
      'seo.meta': SeoMeta;
      'content.winners': ContentWinners;
      'content.point-map': ContentPointMap;
      'content.partner': ContentPartner;
      'content.nav-item': ContentNavItem;
      'content.nav-item-child': ContentNavItemChild;
      'content.link': ContentLink;
      'content.galery': ContentGalery;
      'content.additional-label-event': ContentAdditionalLabelEvent;
      'contact.contact': ContactContact;
      'form.uploud': FormUploud;
      'form.tetx-field': FormTetxField;
      'form.select': FormSelect;
      'form.select-item': FormSelectItem;
      'form.result-item': FormResultItem;
      'form.radio': FormRadio;
      'form.codes': FormCodes;
    }
  }
}
