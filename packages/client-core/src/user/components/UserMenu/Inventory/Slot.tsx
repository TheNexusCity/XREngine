import React, { useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import { Stack } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import styles from '../UserMenu.module.scss'

const useStyles = makeStyles({
  inventoryItem: {
    margin: 15,
    filter: 'drop-shadow(0px 11.2376px 11.2376px rgba(0, 0, 0, 0.25))',
    borderRadius: '6.74257px',
    border: '2px solid rgba(137, 137, 242, 0.53)',
    boxShadow: '0px 11.23762321472168px 11.23762321472168px 0px #00000040',
    width: '25%',
    height: '120px',
    '&:hover': {
      cursor: 'pointer'
    }
  },
  inventoryItemEmpty: {
    margin: 15,
    borderRadius: '8px',
    border: '2px solid #ffffff61',
    background: 'linear-gradient(180deg, rgba(137, 137, 242, 0.5) 0%, rgba(92, 92, 92, 0.5) 100%)',
    boxShadow: '0px 11.23762321472168px 11.23762321472168px 0px #00000040',
    backdropFilter: 'blur(50px)',
    width: '25%',
    height: '120px'
  },
  inventoryContent: {
    '&.being-dragged': {
      position: 'absolute',
      cursor: 'grab'
    },
    '&.being-moved': {
      display: 'none'
    }
  },
  inventoryInsideContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  inventoryItemPreview: {
    width: '90%',
    aspectRatio: '1.2'
  },
  inventoryItemName: {
    wordBreak: 'break-all',
    textAlign: 'center'
  }
})

const MainComponent = (props: any) => {
  const classes = useStyles()

  const getNftType = (url: string) => {
    const elements = url.split('.')
    const fileType = elements[elements.length - 1]

    const videoTypes = ['mp4']

    if (videoTypes.indexOf(fileType) !== -1) return 'video'

    return 'image'
  }

  const ItemSlot = ({ value, slot }: any) => {
    return (
      <Stack justifyContent="center" alignItems="center" className={`${classes.inventoryItem}`}>
        <div
          id={`item-slot-${slot}`}
          className={`item-slot ${classes.inventoryContent}`}
          data-slot={props.slot}
          data-type={`item`}
        >
          <div className={`${classes.inventoryInsideContent}`}>
            {getNftType(value.url) === 'video' ? (
              <video className={`${classes.inventoryItemPreview}`} src={value.url} muted autoPlay loop />
            ) : getNftType(value.url) === 'image' ? (
              <img className={`${classes.inventoryItemPreview}`} src={value.url} alt="" />
            ) : null}

            <div className={value.name.length > 0 ? styles.cssMarquee : styles.cssMarquee}>
              <Typography className={`${classes.inventoryItemName}`}>{`${value.name}`}</Typography>
            </div>

            {/* <video className={`${classes.inventoryItemPreview}`} src={`https://gateway.pinata.cloud/ipfs/QmaqaX1fjJeQdGLxyox5XPFHfk5MG2syGNtS2jn1V8oLz2`} muted autoPlay loop />

            <div className={ value.name.length > 0 ? styles.cssMarquee : styles.cssMarquee }>
              <Typography className={`${classes.inventoryItemName}`}>{`Crowns #${value.name}`}</Typography>
            </div> */}
          </div>
        </div>
      </Stack>
    )
  }

  const EmptySlot = ({ slot }: any) => {
    return (
      <Stack justifyContent="center" alignItems="center" className={`${classes.inventoryItemEmpty}`}>
        <div
          className="item-slot empty"
          style={{ width: '100%', height: '100%' }}
          data-slot={slot}
          data-type={`empty-slot`}
        ></div>
      </Stack>
    )
  }

  return props.value !== null ? <ItemSlot {...props} /> : <EmptySlot {...props} />
}

export default MainComponent
