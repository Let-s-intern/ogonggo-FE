import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adPostingClickData,
  isAdvertisementViewportVisible,
  qualifiesAdvertisementImpression,
  safeAdvertisementPosthogProperties,
  safePromotedPosthogProperties,
} from './adPostingContract.ts';
import { BANNER_POSITION } from '../../widgets/home-banner/model/placement.ts';

describe('advertisement PostHog event contract', () => {
  it('sends the unique exposure ID and normalized posting slot, never the content ID', () => {
    const click = adPostingClickData(
      {
        exposureId: 912,
        category: 'JOB_POSTING',
        position: 'JOB_LIST',
        displayOrder: 3,
        placement: 'JOB_LIST',
      },
      'job',
      771,
    );
    const properties = safeAdvertisementPosthogProperties(
      click.event,
      click.posthogParams,
      true,
      ['IT_BACKEND'],
    );

    assert.equal(click.params.ad_id, 912);
    assert.equal(properties.exposure_id, 912);
    assert.equal(properties.category, 'JOB_POSTING');
    assert.equal(properties.position, 'JOB_LIST');
    assert.equal(properties.audience_type, 'MEMBER');
    assert.deepEqual(properties.job_role_codes, ['IT_BACKEND']);
    assert.equal('content_id' in properties, false);
    assert.equal('ad_id' in properties, false);
  });

  it('uses anonymous distinct-id semantics and omits profile role data for anonymous clicks', () => {
    const properties = safeAdvertisementPosthogProperties(
      'banner_click',
      {
        exposure_id: 55,
        category: 'BANNER',
        position: 'JOB_HOME_TOP_BANNER',
        link_url: 'https://private.example/path',
        banner_position: 2,
      },
      false,
      [],
    );

    assert.deepEqual(properties, {
      exposure_id: 55,
      category: 'BANNER',
      position: 'JOB_HOME_TOP_BANNER',
      audience_type: 'NON_MEMBER',
      job_role_codes: [],
    });
  });

  it('maps banner placement names to the existing backend position enums', () => {
    assert.deepEqual(BANNER_POSITION, {
      HOME_TOP: 'JOB_HOME_TOP_BANNER',
      HOME_BOTTOM: 'JOB_HOME_BOTTOM_BANNER',
      JOB_DETAIL_SIDE: 'JOB_DETAIL_BANNER',
      BOOTCAMP_TOP: 'BOOTCAMP_LIST_TOP_BANNER',
      BOOTCAMP_BOTTOM: 'BOOTCAMP_LIST_BOTTOM_BANNER',
      BOOTCAMP_DETAIL_SIDE: 'BOOTCAMP_DETAIL_BANNER',
    });
  });

  it('requires at least 50 percent visibility for a continuous second', () => {
    assert.equal(qualifiesAdvertisementImpression(0.49, 1000), false);
    assert.equal(qualifiesAdvertisementImpression(0.5, 999), false);
    assert.equal(qualifiesAdvertisementImpression(0.5, 1000), true);
    assert.equal(isAdvertisementViewportVisible(0.5, false), false);
    assert.equal(isAdvertisementViewportVisible(0.5, true), true);
  });

  it('strips content and campaign identifiers from generic promoted card analytics', () => {
    assert.deepEqual(
      safePromotedPosthogProperties({
        is_promoted: 'Y',
        ad_campaign_id: 'exposure-912',
        content_id: '771',
        title: 'Private job title',
        company_name: 'Example Co',
      }),
      { is_promoted: 'Y' },
    );
    assert.equal(safePromotedPosthogProperties({ content_id: '771' }), undefined);
  });

});
